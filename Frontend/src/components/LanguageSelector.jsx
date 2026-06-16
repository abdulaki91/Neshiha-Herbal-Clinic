import React from "react";
import Select from "react-select";
import { useLanguage } from "../i18n/hooks/useLanguage";

export default function LanguageSelector() {
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const options = languages.map((lang) => ({
    value: lang.code,
    label: (
      <div className="flex items-center gap-2">
        <span>{getFlag(lang.name)}</span>
        <span>{lang.name}</span>
      </div>
    ),
  }));

  const selectedOption = options.find((opt) => opt.value === currentLanguage);

  function getFlag(name) {
    switch (name) {
      case "English":
        return "🇺🇸";
      case "Arabic":
        return "🇸🇦";
      case "Afan Oromo":
      case "Amharic":
        return "🇪🇹";
      default:
        return "🌐";
    }
  }

  return (
    <div className="w-40">
      <Select
        value={selectedOption}
        onChange={(option) => changeLanguage(option.value)}
        options={options}
        isSearchable={false}
        classNamePrefix="react-select"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        } // Mobile safe
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "#10B981",
            borderRadius: "0.75rem",
            borderColor: "#10B981",
            color: "white",
          }),
          singleValue: (base) => ({ ...base, color: "white" }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#A7F3D0" : "white",
            color: state.isSelected ? "#065F46" : "#111827",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
      />
    </div>
  );
}
