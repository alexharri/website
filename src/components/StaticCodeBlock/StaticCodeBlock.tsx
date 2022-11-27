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
  marginBottom?: number;
}

export const StaticCodeBlock = (props: Props) => {
  const { language, children, marginBottom } = props;

  return (
    <div className={styles.wrapper} style={{ marginBottom }}>
      <Highlight {...defaultProps} code={children} language={language as any} theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={[className, styles.pre].join(" ")} style={style}>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
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
