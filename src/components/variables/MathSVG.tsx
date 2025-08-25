import { StyleOptions, useStyles } from "../../utils/styles";
import { getMathSvg, getMathSvgDimensions } from "../../utils/math";

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
  const [w, h] = getMathSvgDimensions(label) || [0, 0];

  return (
    <span
      className={s("span")}
      style={{ width: w * scale, height: h * scale }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};
