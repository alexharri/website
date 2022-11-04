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
    text: "#B9DBFA",
    blue: "#399ef4",
    background: "#090D13",
  },
  light: {
    text: "#141d2c",
    blue: "#399ef4",
    background: "#f9f9f9",
  },
};

type ColorName = keyof typeof colors;
