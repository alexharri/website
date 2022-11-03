import { colorValues } from "./cssVariables";

export const initColorsScript = `
  function getInitialColorMode() {
    const colorMode = window.localStorage.getItem("color-mode");
    switch (colorMode) {
      case "dark":
      case "light":
        return colorMode
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof query.matches === "boolean") {
      return query.matches ? "dark" : "light";
    }

    return "dark";
  }

  const colorValues = ${JSON.stringify(colorValues)};
  const colors = colorValues[getInitialColorMode()];

  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty("--color-" + key, value);
  });
`;

const toCssVariablesString = (values: typeof colorValues["dark" | "light"]) =>
  Object.entries(values)
    .map(([key, value]) => `--color-${key}: ${value};`)
    .join("");

export const defaultColorsStyles = `
  html { ${toCssVariablesString(colorValues.dark)} }

  @media (prefers-color-scheme: light) {
    html { ${toCssVariablesString(colorValues.light)} }
  }
`;
