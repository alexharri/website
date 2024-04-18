import { StyleOptions, useStyles } from "../utils/styles";
import { getMathSvg, getMathSvgDimensions } from "./math-svg";

const styles = ({ styled }: StyleOptions) => ({
  span: styled.css`
    display: flex;
    align-items: stretch;
    justify-content: stretch;
  `,
});

interface Props {
  scale?: number;
  label: string;
}

export const MathSVG: React.FC<Props> = (props) => {
  const s = useStyles(styles);

  const { label, scale = 2 } = props;
  const svgHtml = getMathSvg(label) || "";
  const dimensions = getMathSvgDimensions(label) || [0, 0];

  return (
    <span
      className={s("span")}
      style={{ width: dimensions[0] * scale, height: dimensions[1] * scale }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    ></span>
  );
};
