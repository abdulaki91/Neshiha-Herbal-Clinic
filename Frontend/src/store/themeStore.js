import { create } from "zustand";

// Also read by the inline script in index.html (which applies the theme
// before React loads, so there's no light-mode flash) and preserved across
// logout in Sidebar.jsx — keep all three in sync if this key changes.
export const THEME_STORAGE_KEY = "nhc-theme";

const darkQuery =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

const readStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

const systemTheme = () => (darkQuery?.matches ? "dark" : "light");

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

const useThemeStore = create((set, get) => ({
  theme: readStoredTheme() ?? systemTheme(),

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage blocked (private mode etc.) — the choice still applies for
      // this session, it just won't be remembered.
    }
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

applyTheme(useThemeStore.getState().theme);

// Until the user picks a theme explicitly, follow the OS setting live.
darkQuery?.addEventListener?.("change", () => {
  if (readStoredTheme()) return;
  const theme = systemTheme();
  applyTheme(theme);
  useThemeStore.setState({ theme });
});

export default useThemeStore;
