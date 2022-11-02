import { PrismTheme } from "prism-react-renderer";

const darkBlue = "#399ef4";
const lightRed = "#e5949b";
const darkRed = "#da6771";
const green = "#4eb071";
const offWhite = "#9fcff9";
const cyan = "#21c5c7";
const darkGray = "#676f83";
const black = "#080d14";

export const prismTheme: PrismTheme = {
  plain: {
    color: offWhite,
    backgroundColor: black,
  },
  styles: [
    {
      types: ["function"],
      style: {
        color: cyan,
      },
    },
    {
      types: ["string"],
      style: {
        color: darkRed,
      },
    },
    {
      types: [
        "boolean",
        "attr-name",
        "punctuation",
        "prolog",
        "operator",
        "keyword",
      ],
      style: {
        color: darkBlue,
      },
    },
    {
      types: ["number", "inserted"],
      style: {
        color: lightRed,
      },
    },
    {
      types: ["comment"],
      style: {
        color: darkGray,
        fontStyle: "italic",
      },
    },
    {
      types: ["builtin", "constant"],
      style: {
        color: green,
      },
    },
  ],
};
