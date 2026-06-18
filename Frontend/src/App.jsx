import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Pages
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import PortalLayout from "./components/portal/PortalLayout";
import DashboardPage from "./pages/portal/DashboardPage";
import PatientsPage from "./pages/portal/PatientsPage";
import VisitsPage from "./pages/portal/VisitsPage";
import DoctorQueuePage from "./pages/portal/DoctorQueuePage";
import MedicinesPage from "./pages/portal/MedicinesPage";
import PatientDetailPage from "./pages/portal/PatientDetailPage";
import LaboratoryPage from "./pages/portal/LaboratoryPage";
import PharmacyPage from "./pages/portal/PharmacyPage";
import CashierPage from "./pages/portal/CashierPage";
import CashierReportsPage from "./pages/portal/CashierReportsPage";

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

export default function App() {
  const [theme, setTheme] = useState("light");
  const { isAuthenticated, accessToken } = useAuthStore();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Initialize Socket.io when authenticated
  useEffect(() => {
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
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="visits/new" element={<VisitsPage />} />
          <Route path="queue" element={<DoctorQueuePage />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="laboratory" element={<LaboratoryPage />} />
          <Route path="pharmacy" element={<PharmacyPage />} />
          <Route path="cashier" element={<CashierPage />} />
          <Route path="reports" element={<CashierReportsPage />} />
        </Route>

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
