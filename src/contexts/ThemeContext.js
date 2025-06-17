import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

// Utility function to swap rgba values for dark mode
const swapRgba = (rgba) => {
  const [r, g, b, a] = rgba.match(/[\d.]+/g).map(Number);
  return `rgba(${255 - r}, ${255 - g}, ${255 - b}, ${a})`;
};

export const themes = {
  light: {
    background: "#ffffff",
    text: "#000000",
    primary: "#007AFF",
    secondary: "#5856D6",
    surface: "#f2f2f7",
    border: "#c7c7cc",
    // Add rgba colors
    shadow: "rgba(0, 0, 0, 0.1)",
    overlay: "rgba(0, 0, 0, 0.5)",
    highlight: "rgba(0, 122, 255, 0.1)",
    error: "rgba(255, 59, 48, 0.1)",
    success: "rgba(52, 199, 89, 0.1)",
    warning: "rgba(255, 204, 0, 0.1)"
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    surface: "#1c1c1e",
    border: "#38383a",
    // Swapped rgba colors
    shadow: "rgba(255, 255, 255, 0.1)",
    overlay: "rgba(255, 255, 255, 0.5)",
    highlight: "rgba(10, 132, 255, 0.1)",
    error: "rgba(255, 69, 58, 0.1)",
    success: "rgba(48, 209, 88, 0.1)",
    warning: "rgba(255, 214, 10, 0.1)"
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
