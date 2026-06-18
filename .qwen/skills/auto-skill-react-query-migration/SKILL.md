---
name: react-query-migration
description: Migrate pages from manual useEffect+axios+useState to TanStack React Query hooks with centralized query key invalidation for real-time socket updates
source: auto-skill
extracted_at: '2026-06-18T09:30:00.928Z'
---

# React Query Migration Pattern

When refactoring pages from manual `useEffect` + `axios` + `useState` to TanStack React Query, follow this systematic approach.

## 1. Setup

Install and configure QueryClientProvider in `main.jsx`:

```js
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30s before data considered stale
      retry: 1,                   // single retry on failure
      refetchOnWindowFocus: false, // prevent unnecessary refetches
    },
  },
});

// Wrap app with <QueryClientProvider client={queryClient}>
```

## 2. Hook structure

Create hooks in `Frontend/src/hooks/` organized by resource. Each file exports:
- **Query hooks** — `useQuery` wrappers with `select` transformers
- **Mutation hooks** — `useMutation` wrappers that invalidate related queries on success

### Query hook pattern:

```js
export const usePatients = (params = {}) =>
  useQuery({
    queryKey: ["patients", params],      // params in key = auto-refetch on change
    queryFn: () => axiosInstance.get("/patients", { params }),
    select: (res) => ({                   // normalize response shape
      patients: res.data || [],
      pagination: res.pagination,
    }),
  });
```

### Mutation hook pattern:

```js
export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.post("/patients", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};
```

**Key rule:** Every mutation `onSuccess` MUST invalidate all query keys that could be affected. For example, creating a visit invalidates `["visits"]` AND `["queue"]`.

## 3. Page refactoring pattern

### Before (manual useEffect):

```js
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get("/endpoint", { params });
    setData(res.data || []);
  } catch { toast.error("Failed"); }
  finally { setLoading(false); }
};

useEffect(() => { fetchData(); }, [params]);

// Socket: manual re-fetch
socket.on("event", fetchData);
```

### After (React Query):

```js
import { useQueryClient } from "@tanstack/react-query";
import { useSomeHook } from "../../hooks/useSomeResource";

const qc = useQueryClient();
const { data, isLoading } = useSomeHook(params);  // auto-fetches, caches, retries

// Socket: invalidate → React Query auto-refetches in background
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["key"] });

  const attach = () => socket.on("event", invalidate);
  const detach = () => socket.off("event", invalidate);

  if (socket.connected) attach();
  socket.on("connect", attach);  // re-attach on reconnect

  return () => { detach(); socket.off("connect", attach); };
}, [qc]);
```

**What gets removed:** `useState` for data/loading, `fetch*` functions, `useCallback` wrappers, `useRef` for stale closures.

## 4. Socket event → query invalidation mapping

Instead of manually re-fetching on socket events, invalidate the query key. React Query handles deduplication, background refetching, and cache:

| Socket Event | Invalidate Query Key |
|---|---|
| `visit:status-changed` | `["queue"]`, `["dashboard"]`, `["payments"]` |
| `queue:updated` | `["queue"]`, `["dashboard"]` |
| `patient:registered` | `["patients"]`, `["dashboard"]` |
| `payment:completed` | `["payments"]`, `["dashboard"]`, `["queue"]` |
| `prescription:created` | `["prescriptions"]`, `["dashboard"]` |

## 5. Use `enabled` to avoid unnecessary fetches

When a query is only needed for a specific role or tab, use the `enabled` option:

```js
// Only fetch queue for doctors
const { data: queue = [] } = useQueue({ enabled: role === "doctor" });

// Only fetch history when on "recent" tab
const { data: history = [] } = usePaymentHistory(
  { pageSize: 50 },
  activeTab === "recent",  // enabled param
);
```

## 6. Make hooks accept options for flexibility

Always pass through extra options so callers can customize:

```js
export const useQueue = (opts = {}) =>
  useQuery({
    queryKey: ["queue"],
    queryFn: () => axiosInstance.get("/visits/queue"),
    select: (res) => res.data || [],
    refetchInterval: 15_000,
    ...opts,  // caller can override: enabled, staleTime, etc.
  });
```

## 7. Mutation call pattern in components

Replace `async/await try/catch` with mutation callbacks:

```js
// BEFORE
const handleSave = async () => {
  try {
    await axiosInstance.post("/endpoint", data);
    toast.success("Done");
    fetchData();  // manual re-fetch
  } catch (e) {
    toast.error(e.response?.data?.message);
  }
};

// AFTER
const mutation = useCreateSomething();
const handleSave = () => {
  mutation.mutate(data, {
    onSuccess: () => toast.success("Done"),    // mutation handles invalidation
    onError: (e) => toast.error(e.response?.data?.message),
  });
};
```

## 8. Build verification

After all refactoring, run the build to catch compilation errors:

```bash
cd Frontend && npx vite build
```

Common issues to check:
- Unused `useState`, `useEffect`, `useCallback` imports after removing manual fetch
- Remaining references to removed `fetch*` functions
- `loading` → `isLoading` rename in JSX
- Duplicate imports from merge conflicts in edits
