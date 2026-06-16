// index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import "./index.css";
import "./i18n"; // Initialize i18n before the app
import App from "./App.jsx";
import { HelmetProvider } from "react-helmet-async";
// import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </HelmetProvider>
);
