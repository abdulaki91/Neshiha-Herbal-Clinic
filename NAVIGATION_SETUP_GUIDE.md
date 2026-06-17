# Navigation Setup Guide

## Adding Pharmacy and Laboratory Pages to Menu

---

## 🎯 Objective

Add the new Pharmacy and Laboratory pages to your application's navigation menu so users can access them.

---

## 📍 Location of Navigation Files

Based on typical React app structure, your navigation menu is likely in one of these locations:

```
Frontend/src/
├── components/
│   ├── Sidebar.jsx or Navigation.jsx
│   ├── portal/PortalLayout.jsx
│   └── layout/Sidebar.jsx
├── App.jsx (route definitions)
└── routes.js or router.js
```

---

## 🔧 Step 1: Add Routes to App.jsx or Router

### Find Your Router File

Look for where your routes are defined. It might be in `App.jsx`, `routes.js`, or similar.

### Add Imports

```jsx
// Add these imports at the top
import PharmacyPage from "./pages/portal/PharmacyPage";
import LaboratoryPage from "./pages/portal/LaboratoryPage";
```

### Add Routes

```jsx
// Add these routes inside your ProtectedRoute or Portal layout
<Route path="/portal/pharmacy" element={<PharmacyPage />} />
<Route path="/portal/laboratory" element={<LaboratoryPage />} />
```

### Example Router Configuration

```jsx
<Routes>
  <Route element={<ProtectedRoute />}>
    <Route path="/portal" element={<PortalLayout />}>
      {/* Existing routes */}
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="patients" element={<PatientsPage />} />
      <Route path="doctor-queue" element={<DoctorQueuePage />} />

      {/* NEW ROUTES */}
      <Route path="pharmacy" element={<PharmacyPage />} />
      <Route path="laboratory" element={<LaboratoryPage />} />
    </Route>
  </Route>
</Routes>
```

---

## 🎨 Step 2: Add Menu Items to Navigation Component

### Find Your Navigation/Sidebar Component

Common locations:

- `Frontend/src/components/Sidebar.jsx`
- `Frontend/src/components/portal/PortalLayout.jsx`
- `Frontend/src/components/layout/Navigation.jsx`

### Add Icons Import

```jsx
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiPackage, // For Pharmacy
  FiFileText, // For Laboratory
  // ... other icons
} from "react-icons/fi";
```

### Add Menu Items

Locate your menu items array and add:

```jsx
const menuItems = [
  {
    title: "Dashboard",
    icon: FiHome,
    path: "/portal/dashboard",
    roles: ["super_admin", "staff_manager", "data_clerk", "doctor"],
  },
  {
    title: "Patients",
    icon: FiUsers,
    path: "/portal/patients",
    roles: ["super_admin", "data_clerk", "doctor"],
  },
  {
    title: "Doctor Queue",
    icon: FiCalendar,
    path: "/portal/doctor-queue",
    roles: ["super_admin", "doctor"],
  },
  // ADD THESE TWO NEW ITEMS
  {
    title: "Pharmacy",
    icon: FiPackage,
    path: "/portal/pharmacy",
    roles: ["super_admin", "doctor"], // Add "pharmacist" role later
    badge: "New", // Optional badge
  },
  {
    title: "Laboratory",
    icon: FiFileText,
    path: "/portal/laboratory",
    roles: ["super_admin", "doctor"], // Add "lab_tech" role later
    badge: "New", // Optional badge
  },
  // ... other menu items
];
```

### If Using Direct JSX (Not Array)

```jsx
<nav className="mt-6">
  {/* Existing menu items */}
  <NavLink to="/portal/dashboard">Dashboard</NavLink>
  <NavLink to="/portal/patients">Patients</NavLink>
  <NavLink to="/portal/doctor-queue">Doctor Queue</NavLink>

  {/* NEW MENU ITEMS */}
  <NavLink to="/portal/pharmacy" className="nav-item">
    <FiPackage className="icon" />
    <span>Pharmacy</span>
    <span className="badge">New</span>
  </NavLink>

  <NavLink to="/portal/laboratory" className="nav-item">
    <FiFileText className="icon" />
    <span>Laboratory</span>
    <span className="badge">New</span>
  </NavLink>
</nav>
```

---

## 🎯 Step 3: Example Complete Navigation Component

Here's a complete example of what your navigation might look like:

```jsx
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiPackage,
  FiFileText,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";

const Sidebar = () => {
  const { user } = useAuthStore();

  const menuItems = [
    {
      title: "Dashboard",
      icon: FiHome,
      path: "/portal/dashboard",
    },
    {
      title: "Patients",
      icon: FiUsers,
      path: "/portal/patients",
    },
    {
      title: "Doctor Queue",
      icon: FiCalendar,
      path: "/portal/doctor-queue",
      roles: ["doctor", "super_admin"],
    },
    {
      title: "Pharmacy",
      icon: FiPackage,
      path: "/portal/pharmacy",
      badge: "New",
    },
    {
      title: "Laboratory",
      icon: FiFileText,
      path: "/portal/laboratory",
      badge: "New",
    },
    {
      title: "Settings",
      icon: FiSettings,
      path: "/portal/settings",
    },
  ];

  // Filter menu items based on user role if needed
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-emerald-600">Neshiha Clinic</h1>
      </div>

      <nav className="px-4">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition ${
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
            {item.badge && (
              <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
```

---

## 🔐 Step 4: Add Role-Based Access (Optional)

### Create New Roles in Constants

Edit `Backend/src/config/constants.js`:

```javascript
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STAFF_MANAGER: "staff_manager",
  DATA_CLERK: "data_clerk",
  DOCTOR: "doctor",
  PHARMACIST: "pharmacist", // NEW
  LAB_TECHNICIAN: "lab_tech", // NEW
};
```

### Add Permissions

```javascript
export const PERMISSIONS = {
  // ... existing permissions

  [ROLES.PHARMACIST]: [
    "view_prescriptions",
    "dispense_medicine",
    "update_medicine_stock",
    "view_patient_info",
  ],

  [ROLES.LAB_TECHNICIAN]: [
    "view_investigations",
    "enter_results",
    "upload_result_files",
    "view_patient_info",
  ],
};
```

### Protect Routes by Role

```jsx
// In your router
<Route
  path="pharmacy"
  element={
    <RequireRole roles={["super_admin", "doctor", "pharmacist"]}>
      <PharmacyPage />
    </RequireRole>
  }
/>

<Route
  path="laboratory"
  element={
    <RequireRole roles={["super_admin", "doctor", "lab_tech"]}>
      <LaboratoryPage />
    </RequireRole>
  }
/>
```

### Filter Menu Items by Role

```jsx
const visibleMenuItems = menuItems.filter((item) => {
  // Show all items if no role restriction
  if (!item.roles || item.roles.length === 0) return true;

  // Check if user's role is in allowed roles
  return item.roles.includes(user?.role);
});
```

---

## 🎨 Step 5: Add Visual Indicators (Optional)

### Pending Count Badges

Show number of pending prescriptions or investigations:

```jsx
const [pendingPrescriptions, setPendingPrescriptions] = useState(0);
const [pendingInvestigations, setPendingInvestigations] = useState(0);

useEffect(() => {
  // Fetch counts from API
  fetchPendingCounts();
}, []);

// In menu items
{
  title: "Pharmacy",
  icon: FiPackage,
  path: "/portal/pharmacy",
  count: pendingPrescriptions, // Dynamic count
},
```

### Render with Badge

```jsx
<NavLink to="/portal/pharmacy">
  <FiPackage />
  <span>Pharmacy</span>
  {pendingPrescriptions > 0 && (
    <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full">
      {pendingPrescriptions}
    </span>
  )}
</NavLink>
```

---

## 🧪 Step 6: Testing

### Test Navigation

1. ✅ Click on "Pharmacy" menu item
2. ✅ Verify PharmacyPage loads
3. ✅ Click on "Laboratory" menu item
4. ✅ Verify LaboratoryPage loads
5. ✅ Check active state highlighting
6. ✅ Test role-based visibility (if implemented)

### Test Functionality

1. ✅ Search and filter work
2. ✅ Dispense medicine workflow
3. ✅ Enter results workflow
4. ✅ Data persists correctly

---

## 📝 Quick Reference

### File Locations

```
Frontend/src/
├── App.jsx                           → Add routes here
├── components/
│   └── Sidebar.jsx                   → Add menu items here
└── pages/portal/
    ├── PharmacyPage.jsx              → Already created ✅
    └── LaboratoryPage.jsx            → Already created ✅
```

### Required Imports

```jsx
// In App.jsx or routes file
import PharmacyPage from "./pages/portal/PharmacyPage";
import LaboratoryPage from "./pages/portal/LaboratoryPage";

// In Sidebar component
import { FiPackage, FiFileText } from "react-icons/fi";
```

### Route Paths

```
/portal/pharmacy    → PharmacyPage
/portal/laboratory  → LaboratoryPage
```

---

## 🚀 You're Done!

After completing these steps:

1. ✅ Pharmacy and Laboratory pages are accessible via navigation
2. ✅ Users can click menu items to access features
3. ✅ Active states show which page is current
4. ✅ Role-based access control (if implemented)
5. ✅ Ready for production use

---

## 💡 Tips

### Organizing Menu by Section

```jsx
<nav>
  <div className="menu-section">
    <p className="section-title">Main</p>
    <NavLink to="/portal/dashboard">Dashboard</NavLink>
    <NavLink to="/portal/patients">Patients</NavLink>
  </div>

  <div className="menu-section">
    <p className="section-title">Clinical</p>
    <NavLink to="/portal/doctor-queue">Doctor Queue</NavLink>
    <NavLink to="/portal/pharmacy">Pharmacy</NavLink>
    <NavLink to="/portal/laboratory">Laboratory</NavLink>
  </div>
</nav>
```

### Mobile Responsive Menu

```jsx
// Add hamburger toggle for mobile
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Toggle button
<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  <FiMenu />
</button>

// Conditional rendering
<nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
  {/* menu items */}
</nav>
```

---

## 🆘 Troubleshooting

### Menu Item Not Showing

- Check if role filtering is hiding it
- Verify import paths are correct
- Check for typos in path names

### Page Not Loading

- Verify route is registered in App.jsx
- Check import statements
- Ensure route path matches NavLink path

### Active State Not Working

- Use `NavLink` from react-router-dom (not `Link`)
- Check className function receives `isActive` prop
- Verify route paths match exactly

---

That's it! Your navigation is now set up with Pharmacy and Laboratory pages. 🎉
