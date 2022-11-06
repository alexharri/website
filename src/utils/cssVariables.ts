export const colors = {
  text: "var(--color-text)",
  "text-light": "var(--color-text-light)",
  blue: "var(--color-blue)",
  background: "var(--color-background)",
  scheme: "var(--color-scheme)",
};

export const colorValues: Record<
  "dark" | "light",
  Record<ColorName, string>
> = {
  dark: {
    text: "#B9DBFA",
    "text-light": "#6691b5",
    blue: "#399ef4",
    background: "#090D13",
    scheme: "dark",
  },
  light: {
    text: "#141d2c",
    "text-light": "#141d2c",
    blue: "#399ef4",
    background: "#f9f9f9",
    scheme: "light",
  },
};

type ColorName = keyof typeof colors;
