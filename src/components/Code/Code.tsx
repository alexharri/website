import Highlight, { defaultProps } from "prism-react-renderer";
import { prismTheme } from "../StaticCodeBlock/prismTheme";

type Variant = "expression" | "method" | "interface" | "value";

interface Props {
  variant?: Variant;
  children: string;
}

const VARIANTS: Variant[] = ["method", "expression", "interface", "value"];

interface Options {
  defaultVariant: Variant;
  toCode: (variant: Variant, code: string) => string;
  getTokens: <T>(variant: Variant, line: T[]) => T[];
  language: string;
}

function createCodeComponent({ defaultVariant, toCode, getTokens, language }: Options) {
  return (props: Props) => {
    let { variant = defaultVariant, children } = props;
    for (const v of VARIANTS) {
      if (v in props) variant = v;
    }
    if ("interface" in props) variant = "interface";
    return (
      <Highlight
        {...defaultProps}
        code={toCode(variant, children)}
        language={language as any}
        theme={prismTheme}
      >
        {({ tokens: lines, getLineProps, getTokenProps }) => {
          if (lines.length !== 1) {
            console.warn(`Expected 1 line, got ${lines.length}`);
          }
          const line = lines[0];
          const tokens = getTokens(variant, line);
          return (
            <code {...getLineProps({ line: tokens, key: 0 })}>
              {tokens.map((token, i) => (
                <span key={i} {...getTokenProps({ token, key: i })} />
              ))}
            </code>
          );
        }}
      </Highlight>
    );
  };
}

export const Code = {
  ts: createCodeComponent({
    defaultVariant: "expression",
    toCode: (variant, children) => {
      if (variant === "expression") return `type X=${children}`;
      if (variant === "method") return `interface X{${children}(): void}`;
      if (variant === "interface") return `interface ${children}{}`;
      throw new Error(`Unknown variant '${variant}'`);
    },
    getTokens: (variant, tokens) => {
      if (variant === "expression") return tokens.slice(4);
      if (variant === "method") return tokens.slice(4, 5);
      if (variant === "interface") return tokens.slice(2, -2);
      throw new Error(`Unknown variant '${variant}'`);
    },
    language: "typescript",
  }),

  gl: createCodeComponent({
    defaultVariant: "expression",
    toCode: (variant, children) => {
      if (variant === "expression") return `x=${children};`;
      if (variant === "method") return `void ${children}() {}`;
      throw new Error(`Unknown variant '${variant}'`);
    },
    getTokens: (variant, tokens) => {
      if (variant === "expression") return tokens.slice(2, -1);
      if (variant === "method") return tokens.slice(2, 3);
      throw new Error(`Unknown variant '${variant}'`);
    },
    language: "glsl",
  }),

  css: createCodeComponent({
    defaultVariant: "value",
    toCode: (variant, children) => {
      if (variant === "value") return `value:${children}`;
      throw new Error(`Unknown variant '${variant}'`);
    },
    getTokens: (variant, tokens) => {
      if (variant === "value") return tokens.slice(2);
      throw new Error(`Unknown variant '${variant}'`);
    },
    language: "css",
  }),

  html: createCodeComponent({
    defaultVariant: "expression",
    toCode: (_, code) => code,
    getTokens: (_, tokens) => tokens,
    language: "html",
  }),
};
