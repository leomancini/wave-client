import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

const STORAGE_KEY = "themePreference";

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "SYSTEM";
  });

  const getResolvedTheme = useCallback(() => {
    if (themePreference === "SYSTEM") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return themePreference.toLowerCase();
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const applyTheme = () => {
      const resolved = getResolvedTheme();
      document.documentElement.setAttribute("data-theme", resolved);

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          "content",
          resolved === "dark" ? "#1a1a1a" : "#ffffff"
        );
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themePreference === "SYSTEM") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themePreference, getResolvedTheme]);

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, getResolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
