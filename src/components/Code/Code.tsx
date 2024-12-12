import Highlight, { defaultProps } from "prism-react-renderer";
import { prismTheme } from "../StaticCodeBlock/prismTheme";

type Variant = "expression" | "method" | "interface";

function getTypeScriptTokenSlice<T>(variant: Variant, tokens: T[]): T[] {
  if (variant === "expression") return tokens.slice(4);
  if (variant === "method") return tokens.slice(4, 5);
  if (variant === "interface") return tokens.slice(2, -2);
  throw new Error(`Unknown variant '${variant}'`);
}

function getGLSLTokenSlice<T>(variant: Variant, tokens: T[]): T[] {
  if (variant === "expression") return tokens.slice(2, -1);
  if (variant === "method") return tokens.slice(2, 3);
  throw new Error(`Unknown variant '${variant}'`);
}

function getTypeScriptCode(variant: Variant, children: React.ReactNode): string {
  if (variant === "expression") return `type X=${children}`;
  if (variant === "method") return `interface X{${children}(): void}`;
  if (variant === "interface") return `interface ${children}{}`;
  throw new Error(`Unknown variant '${variant}'`);
}

function getGLSLCode(variant: Variant, children: React.ReactNode): string {
  if (variant === "expression") return `x=${children};`;
  if (variant === "method") return `void ${children}() {}`;
  throw new Error(`Unknown variant '${variant}'`);
}

interface Props {
  variant?: Variant;
  children: React.ReactNode;
}

const TypeScript = (props: Props) => {
  let { variant = "expression", children } = props;
  if ("method" in props) variant = "method";
  if ("interface" in props) variant = "interface";
  return (
    <Highlight
      {...defaultProps}
      code={getTypeScriptCode(variant, children)}
      language="typescript"
      theme={prismTheme}
    >
      {({ tokens: lines, getLineProps, getTokenProps }) => {
        if (lines.length !== 1) {
          console.warn(`Expected 1 line, got ${lines.length}`);
        }
        const line = lines[0];
        const tokens = getTypeScriptTokenSlice(variant, line);
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

const GLSL = (props: Props) => {
  let { variant = "expression", children } = props;
  if ("method" in props) variant = "method";
  if ("interface" in props) variant = "interface";
  return (
    <Highlight
      {...defaultProps}
      code={getGLSLCode(variant, children)}
      language={"glsl" as any}
      theme={prismTheme}
    >
      {({ tokens: lines, getLineProps, getTokenProps }) => {
        if (lines.length !== 1) {
          console.warn(`Expected 1 line, got ${lines.length}`);
        }
        const line = lines[0];
        const tokens = getGLSLTokenSlice(variant, line);
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

export const Code = {
  ts: TypeScript,
  gl: GLSL,
};
