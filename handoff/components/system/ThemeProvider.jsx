import React from "react";

export const ThemeContext = React.createContext(null);

/**
 * Provider de tema — aplica data-theme no <html>, persiste em localStorage
 * e opcionalmente fixa data-brand (white-label).
 */
export function ThemeProvider({ defaultTheme = "light", storageKey = "lyra-theme", brand, children }) {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem(storageKey) || defaultTheme; } catch (e) { return defaultTheme; }
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(storageKey, theme); } catch (e) {}
  }, [theme, storageKey]);
  React.useEffect(() => {
    if (brand) document.documentElement.setAttribute("data-brand", brand);
  }, [brand]);
  const val = React.useMemo(() => ({
    theme,
    dark: theme === "dark",
    setTheme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);
  return <ThemeContext.Provider value={val}>{children}</ThemeContext.Provider>;
}

/**
 * Hook do tema — { theme, dark, setTheme, toggle }. Requer <ThemeProvider>.
 */
export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme requer <ThemeProvider>");
  return ctx;
}
ThemeProvider.useTheme = useTheme;
