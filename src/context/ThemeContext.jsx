import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme) {
      return savedTheme;
    }
    return "light";
  };

  const getInitialSubmit = () => {
    const savedSubmit = localStorage.getItem("isEnterSubmit");
    return savedSubmit !== null ? savedSubmit === "true" : true;
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [isEnterSubmit, setIsEnterSubmit] = useState(getInitialSubmit);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("darkMode");
    } else {
      root.classList.remove("darkMode");
    }

    localStorage.setItem("themeMode", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("isEnterSubmit", isEnterSubmit);
  }, [isEnterSubmit]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleSubmit = () => {
    setIsEnterSubmit((prev) => !prev);
  };

  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isEnterSubmit,
        toggleSubmit,
        setLight,
        setDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
