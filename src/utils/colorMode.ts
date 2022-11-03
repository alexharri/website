import { useEffect } from "react";
import { colorValues } from "./cssVariables";

function getCurrentColorMode() {
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

function onSetColorMode(colorMode: "dark" | "light") {
  const colors = colorValues[colorMode];
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty("--color-" + key, value);
  });
}

export function toggleColorMode() {
  const colorMode = getCurrentColorMode() === "light" ? "dark" : "light";
  onSetColorMode(colorMode);
  localStorage.setItem("color-mode", colorMode); // Remember preference
}

export function useListenToColorModeChanges() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      const mode = e.matches ? "dark" : "light";
      onSetColorMode(mode);
      localStorage.removeItem("color-mode"); // Follow new preference, forget old
    };
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
}
