export const colors = {
  text: "var(--color-text)",
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
    blue: "#399ef4",
    background: "#090D13",
    scheme: "dark",
  },
  light: {
    text: "#141d2c",
    blue: "#399ef4",
    background: "#f9f9f9",
    scheme: "light",
  },
};

type ColorName = keyof typeof colors;
