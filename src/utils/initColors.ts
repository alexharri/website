import { colorValues } from "./cssVariables";

export const initColorsScript = `
  function getInitialColorMode() {
    const persistedColorPreference = window.localStorage.getItem("color-mode");
    const hasPersistedPreference = typeof persistedColorPreference === "string";
    // If the user has explicitly chosen light or dark,
    // let's use it. Otherwise, this value will be null.
    if (hasPersistedPreference) {
      return persistedColorPreference;
    }
    // If they haven't been explicit, let's check the media
    // query
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const hasMediaQueryPreference = typeof mql.matches === "boolean";
    if (hasMediaQueryPreference) {
      return mql.matches ? "dark" : "light";
    }
    // If they are using a browser/OS that doesn't support
    // color themes, let's default to 'light'.
    return "light";
  }

  const colorValues = ${JSON.stringify(colorValues)};

  const colorMode = getInitialColorMode();
  const colors = colorValues[colorMode];

  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    console.log(key, value)
    root.style.setProperty("--color-" + key, value);
  });
`;
