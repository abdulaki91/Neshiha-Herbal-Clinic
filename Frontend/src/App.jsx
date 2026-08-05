import React, { useState, useEffect, useLayoutEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Pages
import Home from "./pages/Home";
import PortalLayout from "./components/portal/PortalLayout";

// Portal pages are lazy-loaded: each becomes its own chunk instead of all
// of them landing in the single >500kB bundle a user paid for just to see
// the dashboard. PortalLayout (sidebar/topbar) stays eager since it's on
// screen for every portal route anyway.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/portal/DashboardPage"));
const PatientsPage = lazy(() => import("./pages/portal/PatientsPage"));
const VisitsPage = lazy(() => import("./pages/portal/VisitsPage"));
const DoctorQueuePage = lazy(() => import("./pages/portal/DoctorQueuePage"));
const MedicinesPage = lazy(() => import("./pages/portal/MedicinesPage"));
const PatientDetailPage = lazy(() => import("./pages/portal/PatientDetailPage"));
const LaboratoryPage = lazy(() => import("./pages/portal/LaboratoryPage"));
const PharmacyPage = lazy(() => import("./pages/portal/PharmacyPage"));
const CashierPage = lazy(() => import("./pages/portal/CashierPage"));
const CashierReportsPage = lazy(() => import("./pages/portal/CashierReportsPage"));
const StaffPage = lazy(() => import("./pages/portal/StaffPage"));
const SettingsPage = lazy(() => import("./pages/portal/SettingsPage"));
const AppointmentsPage = lazy(() => import("./pages/portal/AppointmentsPage"));
const ContentManagementPage = lazy(() => import("./pages/portal/ContentManagementPage"));
const BookingRequestsPage = lazy(() => import("./pages/portal/BookingRequestsPage"));

// Store
import useAuthStore from "./store/authStore";
import {
  initializeSocket,
  connectSocket,
  disconnectSocket,
} from "./lib/socket";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
};

// Restricts a route to specific roles; mirrors the backend `authorize` middleware
// so users never land on a page whose API calls would only return 403s.
const RoleRoute = ({ roles, children }) => {
  const { user } = useAuthStore();
  return roles.includes(user?.role) ? children : <Navigate to="/portal" replace />;
};

// Shown while a lazy-loaded route chunk is fetched — same spinner style
// used throughout the app's own data-loading states, so it reads as part
// of the app rather than a generic loader.
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// 404 Page Component
const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">{t("error.404.code")}</h1>
        <p className="text-xl text-gray-600 mt-4">{t("error.404.message")}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState("light");
  const { isAuthenticated, accessToken } = useAuthStore();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Initialize Socket.io when authenticated. This MUST be a layout effect,
  // not a regular effect: React fires layout effects for the whole tree
  // before any passive (useEffect) effect runs, and PortalLayout/Sidebar/
  // Topbar mount in this same initial commit as App. With a plain useEffect
  // here, those descendants' effects — which call getSocket() and, for
  // doctors, subscribeToQueue() to join the "queue:updates" room — fired
  // BEFORE this one (children-before-parent ordering), so getSocket()
  // returned null and subscribeToQueue() silently no-op'd. The doctor's
  // socket was then never in the room the server broadcasts queue changes
  // to, so a newly created visit never reached the dashboard in real time
  // until something else (e.g. a full remount) subscribed it by accident.
  useLayoutEffect(() => {
    if (isAuthenticated && accessToken) {
      initializeSocket(accessToken);
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#363636",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <div
                className={`min-h-screen flex flex-col ${theme === "light" ? "bg-white" : "bg-gray-900"}`}
              >
                <Home />
              </div>
            }
          />
          <Route path="/signin" element={<LoginPage />} />

          {/* Protected Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard stays open to every role */}
            <Route index element={<DashboardPage />} />

            {/* Clinical / patient-operations pages — super admin is an
                administrative role and is deliberately excluded here. */}
            <Route
              path="patients"
              element={
                <RoleRoute roles={["data_clerk", "doctor", "cashier"]}>
                  <PatientsPage />
                </RoleRoute>
              }
            />
            <Route
              path="patients/:id"
              element={
                <RoleRoute roles={["data_clerk", "doctor", "cashier"]}>
                  <PatientDetailPage />
                </RoleRoute>
              }
            />
            <Route
              path="visits"
              element={
                <RoleRoute roles={["data_clerk", "doctor"]}>
                  <VisitsPage />
                </RoleRoute>
              }
            />
            <Route
              path="visits/new"
              element={
                <RoleRoute roles={["data_clerk", "doctor"]}>
                  <VisitsPage />
                </RoleRoute>
              }
            />
            <Route
              path="appointments"
              element={
                <RoleRoute roles={["data_clerk", "doctor"]}>
                  <AppointmentsPage />
                </RoleRoute>
              }
            />
            <Route
              path="queue"
              element={
                <RoleRoute roles={["doctor"]}>
                  <DoctorQueuePage />
                </RoleRoute>
              }
            />
            <Route
              path="medicines"
              element={
                <RoleRoute roles={["data_clerk", "doctor"]}>
                  <MedicinesPage />
                </RoleRoute>
              }
            />
            <Route
              path="laboratory"
              element={
                <RoleRoute roles={["doctor", "data_clerk"]}>
                  <LaboratoryPage />
                </RoleRoute>
              }
            />
            <Route
              path="pharmacy"
              element={
                <RoleRoute roles={["doctor", "cashier", "data_clerk"]}>
                  <PharmacyPage />
                </RoleRoute>
              }
            />
            <Route
              path="cashier"
              element={
                <RoleRoute roles={["cashier"]}>
                  <CashierPage />
                </RoleRoute>
              }
            />
            <Route
              path="reports"
              element={
                <RoleRoute roles={["cashier"]}>
                  <CashierReportsPage />
                </RoleRoute>
              }
            />
            <Route
              path="booking-requests"
              element={
                <RoleRoute roles={["data_clerk", "doctor"]}>
                  <BookingRequestsPage />
                </RoleRoute>
              }
            />
            <Route
              path="staff"
              element={
                <RoleRoute roles={["super_admin", "staff_manager"]}>
                  <StaffPage />
                </RoleRoute>
              }
            />
            <Route
              path="settings"
              element={
                <RoleRoute roles={["super_admin"]}>
                  <SettingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="content"
              element={
                <RoleRoute roles={["super_admin"]}>
                  <ContentManagementPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
