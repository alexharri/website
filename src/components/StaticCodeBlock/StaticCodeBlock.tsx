import Highlight, { defaultProps } from "prism-react-renderer";
import { prismTheme } from "./prismTheme";
import styles from "./StaticCodeBlock.module.scss";

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
  className: string;
  children: string;
}

export const StaticCodeBlock = (props: PreProps) => {
  const { className, children } = props.children.props;

  const language = className.split("-")[1] as "tsx" | "go";

  return (
    <div className={styles.wrapper}>
      <Highlight
        {...defaultProps}
        code={children}
        language={language}
        theme={prismTheme}
      >
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
