import Highlight, { defaultProps } from "prism-react-renderer";
import { prismTheme } from "./prismTheme";

interface Props {
  className: string;
  children: string;
}

export const StaticCodeBlock = (props: Props) => {
  const { className, children } = props;

  const language = className.split("-")[1] as "tsx" | "go";

  return (
    <Highlight
      {...defaultProps}
      code={children}
      language={language}
      theme={prismTheme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
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
  );
};
