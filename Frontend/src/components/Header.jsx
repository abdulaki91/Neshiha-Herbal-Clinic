import React, { useState, useEffect } from "react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "../i18n/hooks/useLanguage";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

  const links = [
    { key: "services", href: "#services" },
    { key: "testimonials", href: "#testimonials" },
    { key: "about", href: "#about" },
    { key: "contact", href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
        {/* Logo */}
        <div className="flex items-center gap-3 text-gray-800">
          <h2 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            {t("header.title")}
          </h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
              {t(`navigation.${link.key}`)}
            </a>
          ))}

          {/* Language Selector */}
          <LanguageSelector />
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
        >
          <svg
            className={`w-6 h-6 transition-transform duration-300 ${
              isMenuOpen ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer */}
        <div className="absolute top-0 right-0 w-3/4 max-w-xs h-full bg-white shadow-xl p-6 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 bg-emerald-50 rounded-lg text-gray-800 font-medium hover:bg-emerald-100 hover:text-emerald-700 transition-colors duration-200"
            >
              {t(`navigation.${link.key}`)}
            </a>
          ))}

          <div className="mt-auto">
            {/* Language Selector for mobile */}
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
