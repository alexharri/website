import Highlight, { defaultProps } from "prism-react-renderer";
import { CopyIcon18 } from "../Icon/CopyIcon18";
import { prismTheme } from "./prismTheme";
import { copyTextToClipboard } from "../../utils/clipboard";
import React, { useEffect, useState } from "react";
import { squiggleIcon10x7Base64Blue, squiggleIcon10x7Base64Red } from "../Icon/SquiggleIcon10x7";
import { useStyles } from "../../utils/styles";
import { StaticCodeBlockStyles } from "./StaticCodeBlock.styles";
import { colors } from "../../utils/cssVariables";
import { TypeAnnotation } from "./TypeAnnotation";

interface TypeAnnotation {
  start: number;
  end: number;
  type: string;
}

interface TypeAnnotations {
  lines: Partial<{
    [lineIndex: number]: TypeAnnotation[];
  }>;
}

/**
 * A markdown code block like so:
 *
 *    ```tsx
 *    someCode()
 *    ```
 *
 * Is converted to the following DOM:
 *
 *    <pre>
 *      <code>
 *        someCode()
 *      <code>
 *    </pre>
 *
 * The weird thing is that `<pre>` does not receive the rendered `<code>`
 * element children. Rather, `<pre>` receives an object containing the
 * props for `<code>`.
 */
interface PreProps {
  children: {
    props: CodeProps;
  };
}

interface CodeProps {
  className?: string;
  children: string;
}

export interface StaticCodeBlockProps {
  language: string;
  children: string;
  small?: boolean;
  marginBottom?: number;
  noFlowOutside?: boolean;
}

const CopyButton = (props: { text: string }) => {
  const s = useStyles(StaticCodeBlockStyles);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <button
      className={s("copyButton")}
      onClick={async () => {
        const copied = await copyTextToClipboard(props.text);
        setCopied(copied);
      }}
      data-copied={copied}
    >
      {copied ? "Copied" : <CopyIcon18 />}
    </button>
  );
};

interface ErrorProps {
  type: "error" | "info";
  message: string;
  padding: string;
  props: Partial<Record<string, number>>;
}

const Message = (props: ErrorProps) => {
  const s = useStyles(StaticCodeBlockStyles);

  const {
    type,
    message,
    padding,
    props: { w: width, shiftLeft, noHeight },
  } = props;

  const spaces = (length: number) =>
    Array.from({ length }).map((_, i) => <React.Fragment key={i}>&nbsp;</React.Fragment>);

  const paddingSpaces = spaces(padding.length);

  const spacesAtStart = (str: string) => {
    let i = 0;
    for (; str.substr(i, 1) === " "; i++) {}
    return spaces(i);
  };

  return (
    <div className={s("outerContainer", { noHeight: noHeight === 1 })}>
      <div style={{ userSelect: "none" }}>{paddingSpaces}</div>
      <div className={s("innerContainer")}>
        <div
          className={s("messageContainer")}
          data-type={type}
          style={{ marginLeft: -(shiftLeft || 0) }}
        >
          {/* <span className={s("injectComment")}>{paddingSpaces}//&nbsp;</span> */}
          {message.split("\n").map((message, i) => (
            <div key={i}>
              <span className={s("injectComment")}>{paddingSpaces}//&nbsp;</span>
              <span>{spacesAtStart(message)}</span>
              {message.trim()}
            </div>
          ))}
        </div>
        <div
          className={s("squiggle")}
          style={{
            backgroundImage: `url("data:image/svg+xml;base64,${
              type === "error" ? squiggleIcon10x7Base64Red : squiggleIcon10x7Base64Blue
            }")`,
          }}
        >
          {spaces(width || 1)}
        </div>
      </div>
      <div className={s("fillSpace")} />
    </div>
  );
};

interface Token {
  types: string[];
  content: string;
  empty?: boolean;
}

const jsDocRegex =
  /^(?<pre>\s*(\*|\/)+\s*)(?<keyword>@[a-z\-]+)(\s{(?<typeExpr>.*)})?(\s(?<name>\[?[a-z\.]+\]?))?(?<post>.*)/i;

const JSDocLine = (props: TokenProps) => {
  const { token, getTokenProps } = props;

  const match = jsDocRegex.exec(token.content);
  let { pre, keyword, typeExpr, name, post } = match!.groups!;

  const expr = typeExpr && (
    <Highlight
      {...defaultProps}
      code={`type X=${typeExpr}`}
      language={"typescript" as any}
      theme={prismTheme}
    >
      {({ tokens: lines, getLineProps, getTokenProps }) => (
        <>
          {lines.map((tokens, i) => {
            tokens = tokens.slice(4);
            return (
              <span {...getLineProps({ line: tokens, key: i })}>
                {tokens.map((token, i) => (
                  <Token token={token} getTokenProps={getTokenProps} key={i} />
                ))}
              </span>
            );
          })}
        </>
      )}
    </Highlight>
  );

  return (
    <>
      <span {...getTokenProps({ token: { ...token, content: pre }, key: 1000 })} />

      <span style={{ color: colors.blue }}>
        {keyword}
        {expr ? <>&nbsp;</> : null}
      </span>
      {expr ? (
        <>
          <span style={{ color: colors.blue }}>{"{"}</span>
          <span>{expr}</span>
          <span style={{ color: colors.blue }}>{"}"}</span>
        </>
      ) : null}
      {name && <span style={{ color: colors.text800 }}>&nbsp;{name}</span>}

      {post && <span {...getTokenProps({ token: { ...token, content: post }, key: 1001 })} />}
    </>
  );
};

interface TokenProps {
  token: Token;
  getTokenProps: (options: { token: Token; key: number }) => any;
  typeAnnotation?: TypeAnnotation | null;
}

const Token = (props: TokenProps) => {
  const { token, getTokenProps, typeAnnotation } = props;
  if (props.token.types.join(",") === "comment" && jsDocRegex.test(props.token.content)) {
    return <JSDocLine {...props} />;
  }

  let { children, ...tokenProps } = getTokenProps({ token, key: 0 });
  if (typeof children === "string" && children.startsWith("//=>")) {
    children = (
      // I really don't like the //=> ligature in Fira Code
      <>
        <span style={{ fontVariantLigatures: "none" }}>//</span>
        <span>{"=>"}</span>
        {children.slice(4)}
      </>
    );
  }
  let content = <span {...tokenProps} children={children} />;

  if (typeAnnotation) {
    return <TypeAnnotation type={typeAnnotation.type}>{content}</TypeAnnotation>;
  }

  return content;
};

interface LineProps {
  line: Token[];
  index: number;
  last: boolean;
  getLineProps: () => any;
  getTokenProps: (options: { token: Token; key: number }) => any;
  typeAnnotations: TypeAnnotations;
}

function leadingSpaces(s: string) {
  let i = 0;
  for (; i < s.length && s[i] === " "; i++);
  return i;
}

const Line = (props: LineProps) => {
  const { line, index, getLineProps, getTokenProps } = props;
  const content = line.map((token) => token.content).join("");

  for (const type of ["error", "info"] as const) {
    const errorMarker = `// @${type} `;
    const errorIndex = content.indexOf(errorMarker);
    if (errorIndex !== -1) {
      const afterMarker = content.slice(errorIndex + errorMarker.length);
      const propsEnd = afterMarker.indexOf("}");
      const propsStr = afterMarker.slice(1, propsEnd).trim();
      const props = propsStr
        .split(",")
        .map((part) => {
          const [key, str] = part.split("=").map((s) => s.trim());
          return [key, Number(str)] as const;
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Partial<Record<string, number>>);

      return (
        <Message
          type={type}
          message={afterMarker
            .slice(propsEnd + 2)
            .trim()
            .replace("\\n", "\n")}
          padding={content.slice(0, errorIndex)}
          props={props}
        />
      );
    }
  }

  const isEmpty = content === "\n";
  if (props.last && isEmpty) return null;

  const annotationByIndex: Partial<Record<number, TypeAnnotation>> = {};
  for (const annotation of props.typeAnnotations.lines[index] || []) {
    annotationByIndex[annotation.start] = annotation;
  }

  const typeAnnotations: Array<TypeAnnotation | null> = [];
  let tokenIndex = 0;
  for (const token of line) {
    const adjustedIndex = tokenIndex + leadingSpaces(token.content);
    typeAnnotations.push(
      token.content.length > 0 ? annotationByIndex[adjustedIndex] || null : null,
    );
    tokenIndex += token.content.length;
  }

  return (
    <div {...getLineProps()}>
      {line.map((token, i) => {
        const typeAnnotation = typeAnnotations[i];
        return (
          <Token
            token={token}
            getTokenProps={getTokenProps}
            typeAnnotation={typeAnnotation}
            key={i}
          />
        );
      })}
    </div>
  );
};

export const StaticCodeBlock = (props: StaticCodeBlockProps) => {
  const s = useStyles(StaticCodeBlockStyles);

  const { language, marginBottom, small, noFlowOutside } = props;
  let { children } = props;

  const lines = children.trim().split("\n");
  let typeAnnotations: TypeAnnotations = { lines: {} };
  const typeAnnotationMarker = "// @type_annotations ";
  if (lines[lines.length - 1].startsWith(typeAnnotationMarker)) {
    const typeAnnotationsStr = lines.splice(lines.length - 1, 1)[0].split(typeAnnotationMarker)[1];
    typeAnnotations = JSON.parse(typeAnnotationsStr.replaceAll("/newline", "\n"));
    children = lines.join("\n");
  }

  const padding = small ? 16 : 24;
  const fontSize = small ? 14 : 16;
  const paddingRight = small ? 32 : 48;

  const textToCopy = children
    .replaceAll(/@error {.*} /g, "Error: ")
    .replaceAll(/@info {.*} /g, "Info: ");

  return (
    <div className="pre">
      <div className={s("outerWrapper", { noFlowOutside })}>
        <CopyButton text={textToCopy} />
        <div className={s("wrapper")} style={{ marginBottom, padding, paddingRight }}>
          <Highlight
            {...defaultProps}
            code={children}
            language={language as any}
            theme={prismTheme}
          >
            {({ className, style, tokens: lines, getLineProps, getTokenProps }) => (
              <pre className={[className, s("pre")].join(" ")} style={{ ...style, fontSize }}>
                {lines.map((line, i) => {
                  return (
                    <Line
                      key={i}
                      getLineProps={() => getLineProps({ line, key: i })}
                      getTokenProps={getTokenProps}
                      last={i === lines.length - 1}
                      index={i}
                      line={line}
                      typeAnnotations={typeAnnotations}
                    />
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
};

export const Pre = (props: PreProps) => {
  const { children, className } = props.children.props;
  const language = className?.split("-")[1] as "tsx" | "go";
  return <StaticCodeBlock children={children} language={language} />;
};
