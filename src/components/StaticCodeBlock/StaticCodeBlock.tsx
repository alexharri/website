import Highlight, { defaultProps } from "prism-react-renderer";
import { CopyIcon18 } from "../Icon/CopyIcon18";
import styles from "./StaticCodeBlock.module.scss";
import { prismTheme } from "./prismTheme";
import { copyTextToClipboard } from "../../utils/clipboard";
import { useEffect, useState } from "react";

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
}

const CopyButton = (props: { text: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <button
      className={styles.copyButton}
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

export const StaticCodeBlock = (props: StaticCodeBlockProps) => {
  const { language, children, marginBottom, small } = props;

  const padding = small ? 16 : 24;
  const fontSize = small ? 14 : 16;

  return (
    <div className={styles.outerWrapper}>
      <CopyButton text={children} />
      <div className={styles.wrapper} style={{ marginBottom, padding }}>
        <Highlight {...defaultProps} code={children} language={language as any} theme={prismTheme}>
          {({ className, style, tokens: lines, getLineProps, getTokenProps }) => (
            <pre className={[className, styles.pre].join(" ")} style={{ ...style, fontSize }}>
              {lines.map((line, i) => {
                const lastLine = i === lines.length - 1;
                const isEmpty = () => line.map((token) => token.content).join("") === "\n";
                if (lastLine && isEmpty()) return null;
                return (
                  <div {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                      <span {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};

export const Pre = (props: PreProps) => {
  const { children, className } = props.children.props;
  const language = className?.split("-")[1] as "tsx" | "go";
  return <StaticCodeBlock children={children} language={language} />;
};