---
name: notification-bell
description: Real-time notification bell with badge counter, dropdown list, socket-driven updates, and mark-all-read — merge API notifications with live socket events
source: auto-skill
extracted_at: '2026-06-18T14:30:00.000Z'
---

# Notification Bell with Badge and Dropdown

A real-time notification bell in the header that shows an unread badge count, opens a dropdown with a notification list, and updates live via socket events.

## 1. Architecture

Two data sources merged into one list:
- **API** (`GET /notifications`) — persisted notifications from the backend
- **Socket events** — real-time notifications added to local state

```jsx
const { data: apiNotifs = [] } = useNotifications();   // React Query
const [localNotifs, setLocalNotifs] = useState([]);      // Socket-driven

// Merge: API first, then local real-time ones prepended
const allNotifications = useCallback(() => {
  const apiIds = new Set(apiNotifs.map((n) => n.id));
  const merged = [...apiNotifs];
  for (const n of localNotifs) {
    if (!apiIds.has(n.id)) merged.unshift(n);
  }
  return merged;
}, [apiNotifs, localNotifs]);
```

## 2. Socket-driven local notifications

Listen for all relevant events and add them to local state with a title, message, type, and timestamp:

```jsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const addLocal = (title, message, type = "info") => {
    setLocalNotifs((prev) => [{
      id: Date.now().toString(),
      title, message, type,
      isRead: false,
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 50));  // Cap at 50
  };

  const attach = () => {
    socket.on("notification:new", (d) =>
      addLocal(d.title || d.message, d.message || "", d.type));

    socket.on("visit:status-changed", (v) =>
      addLocal("Visit Updated", `Status: ${v.status?.replace("_", " ")}`));

    socket.on("patient:registered", (p) =>
      addLocal("New Patient", `${p.firstName} ${p.lastName} registered`, "success"));

    socket.on("payment:completed", (p) =>
      addLocal("Payment Received", `${parseFloat(p.amount || 0).toFixed(2)} ETB`, "success"));

    socket.on("prescription:created", () =>
      addLocal("Prescription Added", "New prescription created"));
  };

  const detach = () => {
    socket.off("notification:new");
    socket.off("visit:status-changed");
    socket.off("patient:registered");
    socket.off("payment:completed");
    socket.off("prescription:created");
  };

  // Attach immediately if connected, otherwise wait for connect
  if (socket.connected) attach();
  socket.on("connect", attach);

  // Also invalidate the API query on new notifications
  socket.on("notification:new", () =>
    qc.invalidateQueries({ queryKey: ["notifications"] }));

  return () => { detach(); socket.off("connect", attach); };
}, [qc]);
```

**Critical: `socket.on("connect", attach)`** — ensures listeners re-attach after a disconnect/reconnect cycle. Without this, the bell stops receiving events after a network interruption.

## 3. Unread count

Derived from the merged list:

```jsx
useEffect(() => {
  setUnreadCount(allNotifications().filter((n) => !n.isRead).length);
}, [apiNotifs, localNotifs]);
```

## 4. Bell button with badge

```jsx
<div ref={dropdownRef} className="relative">
  <button
    onClick={() => setShowDropdown(!showDropdown)}
    className="relative p-2 rounded-lg hover:bg-gray-100"
  >
    <FiBell className="w-6 h-6 text-gray-600" />
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}
  </button>

  {showDropdown && (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-50 max-h-96 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-xs text-emerald-600">
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {(() => {
          const list = allNotifications();
          return list.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            list.slice(0, 20).map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 ${
                !n.isRead ? "bg-blue-50/50" : ""
              }`}>
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(n.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              </div>
            ))
          );
        })()}
      </div>
    </div>
  )}
</div>
```

## 5. Mark all read

```jsx
const handleMarkAllRead = async () => {
  try {
    await axiosInstance.delete("/notifications");  // Backend marks all as read
  } catch { /* silent */ }
  setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  qc.invalidateQueries({ queryKey: ["notifications"] });
};
```

## 6. Outside-click handler

```jsx
const dropdownRef = useRef(null);

useEffect(() => {
  const handler = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target))
      setShowDropdown(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);
```

## 7. Helper functions

```jsx
const getTypeColor = (type) => {
  switch (type) {
    case "urgent": case "error": return "bg-red-100 text-red-700";
    case "success": return "bg-emerald-100 text-emerald-700";
    case "warning": return "bg-yellow-100 text-yellow-700";
    default: return "bg-blue-100 text-blue-700";
  }
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};
```

## 8. Complete imports

```jsx
import { FiBell, FiCheck } from "react-icons/fi";
import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../../lib/socket";
import axiosInstance from "../../lib/axios";
import { useNotifications } from "../../hooks/useDashboard";
```