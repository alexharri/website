import Highlight, { defaultProps } from "prism-react-renderer";
import { StaticCodeBlock } from "./StaticCodeBlock/StaticCodeBlock";

interface Props {
  className?: string;
  children: string;
}

export const Code = (props: Props) => {
  const { className, children } = props;

  if (className) {
    return <StaticCodeBlock {...props} className={className} />;
  }

  return <code>{children}</code>;
};
