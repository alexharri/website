export const colors = {
  // Consider 'text' to mean 'text-100'
  text: "var(--color-text)",
  "text-300": "var(--color-text-300)",
  "text-600": "var(--color-text-600)",
  blue: "var(--color-blue)",
  green: "var(--color-green)",
  background: "var(--color-background)",
  "background-500": "var(--color-background-500)",
  "code-background": "var(--color-code-background)",
  "token-function": "var(--color-token-function)",
  "token-number": "var(--color-token-number)",
  "token-string": "var(--color-token-string)",
  "token-comment": "var(--color-token-comment)",
  scheme: "var(--color-scheme)",
};

export const colorValues: Record<
  "dark" | "light",
  Record<ColorName, string>
> = {
  dark: {
    text: "#B9DBFA",
    "text-300": "#9fcff9",
    "text-600": "#6691b5",
    blue: "#399ef4",
    green: "#4eb071",
    background: "#090D13",
    "background-500": "#17222F",
    "code-background": "#192535",
    "token-function": "#21c5c7",
    "token-number": "#e5949b",
    "token-string": "#da6771",
    "token-comment": "#676f83",
    scheme: "dark",
  },
  light: {
    text: "#141d2c",
    "text-300": "#1d2737",
    "text-600": "#456279",
    blue: "#006bc5",
    green: "#008f10",
    background: "#f9f9f9",
    "background-500": "#eaeeef",
    "code-background": "#d0e8f6",
    "token-function": "#a11fa5",
    "token-number": "#ab5e07",
    "token-string": "#ba391a",
    "token-comment": "#7998a7",
    scheme: "light",
  },
};

type ColorName = keyof typeof colors;
