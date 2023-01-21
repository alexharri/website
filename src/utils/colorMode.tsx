import React, { useContext, useMemo } from "react";
import { useEffect, useState } from "react";
import { colorValues } from "./cssVariables";

export const DISABLE_LIGHT_MODE = true;

type ColorMode = "dark" | "light";

function getCurrentColorMode(): ColorMode {
  if (DISABLE_LIGHT_MODE) return "dark";

  const colorMode = window.localStorage.getItem("color-mode");
  switch (colorMode) {
    case "dark":
    case "light":
      return colorMode;
  }

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  if (typeof query.matches === "boolean") {
    return query.matches ? "dark" : "light";
  }

  return "dark";
}

function applyColorMode(colorMode: ColorMode) {
  const colors = colorValues[colorMode];
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty("--color-" + key, value);
  });
}

const ColorModeContext = React.createContext<{
  colorMode: ColorMode | null;
  setColorMode: (mode: ColorMode) => void;
}>({ colorMode: null, setColorMode: () => {} });

export const ColorModeProvider = (props: { children: React.ReactNode }) => {
  const [colorMode, _setColorMode] = useState<ColorMode | null>(DISABLE_LIGHT_MODE ? "dark" : null);

  const setColorMode = (colorMode: ColorMode) => {
    applyColorMode(colorMode);
    _setColorMode(colorMode);
    localStorage.setItem("color-mode", colorMode); // Persist preference
  };

  useEffect(() => {
    if (DISABLE_LIGHT_MODE) return;

    _setColorMode(getCurrentColorMode());

    const listener = (e: MediaQueryListEvent) => {
      const colorMode = e.matches ? "dark" : "light";
      applyColorMode(colorMode);
      _setColorMode(colorMode);
      localStorage.removeItem("color-mode"); // Follow browser preference, forget old
    };

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  const value = useMemo(() => ({ colorMode, setColorMode }), [colorMode]);

  return <ColorModeContext.Provider value={value}>{props.children}</ColorModeContext.Provider>;
};

export function useColorMode() {
  const { colorMode, setColorMode } = useContext(ColorModeContext);
  return [colorMode, setColorMode] as const;
}
