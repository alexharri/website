export const cssVariables = {
  fontMonospace: "'Fira Code', monospace",
  fontFamily: "'Fira Sans', sans-serif",
  contentWidth: 750,
  contentPadding: 24,
  mobileWidth: 800,
};

const text400 = "#6691b5";

export const colors = {
  text: "#B9DBFA",
  text200: "#486d8c",
  text400,
  text700: "#99bad5",
  text800: "#9fcff9",
  blue: "#399ef4",
  blue200: "#246eac",
  blue400: "#2e89d6",
  blue700: "#6ac2fa",
  darkBlue400: "#032949",
  darkRed400: "#99081d",
  green: "#4eb071",
  background: "#090D13",
  backgroundRgb: "9, 13, 19",
  background700: "#1c2837",
  background500: "#17222F",
  background300: "#101821",
  background200: "#0e1824",
  background100: "#051420",
  codeBackground: "#192535",
  medium700: "#4c606f",
  medium500: "#293946",
  medium400: "#1f2d38",
  token: {
    function: "#21c5c7",
    number: "#e5949b",
    string: "#da6771",
    comment: "#676f83",
  },
  headerBackground: "rgba(9, 13, 19, 0.6)",
  headerBorderBackground: "rgba(9, 13, 19, 0.8)",
  lightRgb: "255, 255, 255",
  blueRgb: "57, 157, 244",
  commit: "#4f9fff",
  command: "#21c5c7",
  "cli-arg": text400,

  // Aliases
  get string() {
    return this.token.string;
  },
  get comment() {
    return this.token.comment;
  },
};
