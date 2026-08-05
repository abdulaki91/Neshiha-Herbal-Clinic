import { useState } from "react";
import { languages } from "../../i18n/config";

/**
 * A labeled input/textarea that stores one value per locale — `name.en`,
 * `name.am`, `name.om`, `name.ar` — all registered at once so switching
 * tabs never loses what was typed in another language. Only `en` is ever
 * required; every other locale is optional (site falls back to English).
 */
const TranslatableInput = ({
  register,
  name,
  label,
  hint,
  multiline = false,
  rows = 3,
  required = false,
  error,
}) => {
  const [activeLocale, setActiveLocale] = useState("en");
  const Tag = multiline ? "textarea" : "input";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex gap-1">
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => setActiveLocale(lang.code)}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                activeLocale === lang.code
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {languages.map((lang) => (
        <Tag
          key={lang.code}
          rows={multiline ? rows : undefined}
          {...register(
            `${name}.${lang.code}`,
            lang.code === "en" && required
              ? { required: "This field is required" }
              : {},
          )}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition ${
            multiline ? "resize-none" : ""
          } ${activeLocale === lang.code ? "" : "hidden"}`}
        />
      ))}

      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

export default TranslatableInput;
