import Highlight, { defaultProps } from "prism-react-renderer";
import styles from "./StaticCodeBlock.module.scss";
import { prismTheme } from "./prismTheme";


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

interface Props {
  language: string;
  children: string;
  small?: boolean;
  marginBottom?: number;
}

export const StaticCodeBlock = (props: Props) => {
  const { language, children, marginBottom, small } = props;

  const padding = small ? 16 : 24;
  const fontSize = small ? 14 : 16;

  return (
    <div className={styles.wrapper} style={{ marginBottom, padding }}>
      <Highlight {...defaultProps} code={children} language={language as any} theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={[className, styles.pre].join(" ")}
            style={{ ...style, fontSize }}
          >
            {tokens.map((line, i) => {
              const lastLine = i === tokens.length - 1;
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
  );
};

export const Pre = (props: PreProps) => {
  const { children, className } = props.children.props;
  const language = className?.split("-")[1] as "tsx" | "go";
  return <StaticCodeBlock children={children} language={language} />;
};