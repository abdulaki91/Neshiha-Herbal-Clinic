import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SigninPage from "./pages/SigninPage";

export default function App() {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Main site with header/footer */}
        <Route
          path="/"
          element={
            <div
              className={`min-h-screen flex flex-col font-['Lexend','Noto Sans',sans-serif] ${
                theme === "light" ? "bg-white" : "bg-gray-900"
              }`}
            >
              <Header theme={theme} toggleTheme={toggleTheme} />
              <main className="flex-1 px-6 md:px-20">
                <Home />
              </main>
              <Footer />
            </div>
          }
        />

        {/* Admin sign in page */}

        {/* Admin page (protected) */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/signin" element={<SigninPage />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={<div className="text-center font-bold">404 Not Found</div>}
        />
      </Routes>
    </Router>
  );
}
