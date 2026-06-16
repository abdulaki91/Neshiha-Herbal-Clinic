import React from "react";

export default function Sidebar({ menuItems, activeItem, onSelect }) {
  return (
    <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
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
