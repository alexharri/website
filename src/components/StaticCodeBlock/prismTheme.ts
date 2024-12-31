import { PrismTheme } from "prism-react-renderer";
import { colors } from "../../utils/cssVariables";

export const prismTheme: PrismTheme = {
  plain: {
    color: colors.text800,
  },
  styles: [
    {
      types: ["function"],
      style: { color: colors.token.function },
    },
    {
      types: ["string"],
      style: { color: colors.token.string },
    },
    {
      types: [
        "boolean",
        "attr-name",
        "punctuation",
        "prolog",
        "operator",
        "keyword",
        "selector",
        "unit",
      ],
      style: { color: colors.blue },
    },
    {
      types: ["number", "inserted"],
      style: { color: colors.token.number },
    },
    {
      types: ["comment"],
      style: { color: colors.token.comment, fontStyle: "italic" },
    },
    {
      types: ["builtin", "constant", "class-name", "property"],
      style: { color: colors.green },
    },
  ],
};
