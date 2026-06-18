import React from "react";
import { useTranslation } from "react-i18next";

export default function Sidebar({ menuItems, activeItem, onSelect }) {
  const { t } = useTranslation();

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">{t("sidebar.adminPanel")}</h2>
      <nav className="flex flex-col space-y-4">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`text-left px-2 py-1 rounded ${
              activeItem === item ? "bg-gray-700" : "hover:text-gray-300"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
