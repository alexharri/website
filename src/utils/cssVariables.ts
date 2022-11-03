export const colors = {
  text: "var(--color-text)",
  blue: "var(--color-blue)",
  background: "var(--color-background)",
};

export const colorValues: Record<
  "dark" | "light",
  Record<ColorName, string>
> = {
  dark: {
    text: "#9fcff9",
    blue: "#399ef4",
    background: "#090D13",
  },
  light: {
    text: "#333333",
    blue: "#399ef4",
    background: "#f3f3f3",
  },
};

type ColorName = keyof typeof colors;
