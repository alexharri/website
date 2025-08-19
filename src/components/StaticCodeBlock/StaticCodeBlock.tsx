import Highlight, { defaultProps, Prism } from "prism-react-renderer";
import { CopyIcon18 } from "../Icon/CopyIcon18";
import { prismTheme } from "./prismTheme";
import { copyTextToClipboard } from "../../utils/clipboard";
import React, { useEffect, useMemo, useState } from "react";
import { squiggleIcon10x7Base64Blue, squiggleIcon10x7Base64Red } from "../Icon/SquiggleIcon10x7";
import { useStyles } from "../../utils/styles";
import { StaticCodeBlockStyles } from "./StaticCodeBlock.styles";
import { colors } from "../../utils/cssVariables";
import { parseColor } from "../../utils/color";

// Add C# syntax highlighting
(typeof global !== "undefined" ? global : (window as any)).Prism = Prism;
require("prismjs/components/prism-csharp");
require("prismjs/components/prism-glsl");

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
  language?: string;
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

  // Special handling for the @import JSDoc tag. This is fairly hacky, which is
  // because I'm avoiding reworking the JSDoc regex above.
  let importModuleName: string | null = null;
  if (name === "from") {
    try {
      const preEndComment = post.split("*/")[0];
      if (typeof JSON.parse(preEndComment) === "string") {
        importModuleName = preEndComment.trim();
        name = "";
        post = "";
      }
    } catch (e) {} // No match
  }

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

      {importModuleName && (
        <>
          &nbsp;<span style={{ color: colors.blue }}>from</span>
          &nbsp;<span style={{ color: colors.token.string }}>{importModuleName}</span>
          &nbsp;<span style={{ color: colors.token.comment }}>*/</span>
        </>
      )}

      {post && <span {...getTokenProps({ token: { ...token, content: post }, key: 1001 })} />}
    </>
  );
};

// 's' flag makes '.' match newlines
const tagRegex =
  /^(?<before>.*?)<(?<command>[@~])(?<tag>.+?)>(?<content>.*?)<\/[@~]>(?<after>.*)$/is;
type TagRegexKeys = "before" | "command" | "tag" | "content" | "after";

interface TokenProps {
  token: Token;
  getTokenProps: (options: { token: Token; key: number }) => any;
}

const Token = (props: TokenProps) => {
  const { token, getTokenProps } = props;
  if (props.token.types.join(",") === "comment" && jsDocRegex.test(props.token.content)) {
    return <JSDocLine {...props} />;
  }

  let { children, ...tokenProps } = getTokenProps({ token, key: 0 });

  if (typeof children === "string") {
    let s = children;
    const toRender: React.ReactNode[] = [];

    if (s.startsWith("//=>")) {
      toRender.push(<span style={{ fontVariantLigatures: "none" }}>//</span>);
      toRender.push("=>");
      s = s.slice(4);
    }

    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(s))) {
      const { before, command, tag, content, after } = match.groups! as Record<
        TagRegexKeys,
        string
      >;

      toRender.push(before);
      switch (command) {
        case "@": // Color command
          toRender.push(<span style={{ color: parseColor(tag) }}>{content}</span>);
          break;
        case "~": // Highlight language command
          toRender.push(
            <Highlight {...defaultProps} code={content} language={tag as any} theme={prismTheme}>
              {({ tokens: lines, getLineProps, getTokenProps }) => (
                <>
                  {lines.map((tokens, i) => (
                    <span {...getLineProps({ line: tokens, key: i })}>
                      {tokens.map((token, i) => (
                        <Token token={token} getTokenProps={getTokenProps} key={i} />
                      ))}
                    </span>
                  ))}
                </>
              )}
            </Highlight>,
          );
          break;
        default:
          throw new Error(`Unknown command '${tag}'`);
      }
      s = after;
    }

    toRender.push(s);
    return (
      <span {...tokenProps}>
        {toRender.map((c, i) => (
          <React.Fragment key={i}>{c}</React.Fragment>
        ))}
      </span>
    );
  }

  return <span {...tokenProps} children={children} />;
};

interface LineProps {
  line: Token[];
  last: boolean;
  getLineProps: () => any;
  getTokenProps: (options: { token: Token; key: number }) => any;
}

const Line = (props: LineProps) => {
  const { line, getLineProps, getTokenProps } = props;
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
  return (
    <div {...getLineProps()}>
      {line.map((token, key) => (
        <Token token={token} getTokenProps={getTokenProps} key={key} />
      ))}
    </div>
  );
};

function removeOrReplaceCommands(text: string): string {
  let match: RegExpMatchArray | null = null;
  while ((match = tagRegex.exec(text))) {
    const { before, content, after } = match.groups! as Record<TagRegexKeys, string>;
    text = before + content + after;
  }
  // prettier-ignore
  text = text
    .replaceAll(/@error {.*} /g, "Error: ")
    .replaceAll(/@info {.*} /g, "Info: ");
  return text;
}

export const StaticCodeBlock = (props: StaticCodeBlockProps) => {
  const s = useStyles(StaticCodeBlockStyles);

  const { children, marginBottom, small, noFlowOutside } = props;

  const [language, directive] = (props.language ?? "text").split(":");
  const noLigatures = directive === "no_ligatures";

  const padding = small ? 16 : 24;
  const fontSize = small ? 14 : 16;
  const paddingRight = small ? 32 : 48;

  const textToCopy = useMemo(() => removeOrReplaceCommands(children), [children]);

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
              <pre
                className={[className, s("pre", { noLigatures })].join(" ")}
                style={{ ...style, fontSize }}
              >
                {lines.map((line, i) => {
                  return (
                    <Line
                      key={i}
                      getLineProps={() => getLineProps({ line, key: i })}
                      getTokenProps={getTokenProps}
                      last={i === lines.length - 1}
                      line={line}
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
