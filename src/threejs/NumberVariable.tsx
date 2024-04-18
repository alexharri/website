import { StyleOptions, useStyles } from "../utils/styles";
import { getMathSvg } from "./math-svg";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

const styles = ({ styled }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
});

export type NumberVariableSpec = {
  label?: string;
  type: "number";
  range: [number, number];
  value: number;
  step?: number;
};

interface NumberVariableProps {
  dataKey: string;
  value: number;
  onValueChange: (value: number) => void;
  spec: NumberVariableSpec;
}

export const NumberVariable: React.FC<NumberVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange } = props;
  const [min, max] = spec.range;

  const s = useStyles(styles);

  let svgLabel: string | null = null;

  if (spec.label && spec.label.startsWith("math:")) {
    const [_, label] = spec.label.split("math:");
    svgLabel = getMathSvg(label);
  }

  return (
    <label className={s("wrapper")}>
      {svgLabel ? (
        <span style={{ fontSize: 24 }} dangerouslySetInnerHTML={{ __html: svgLabel }} />
      ) : (
        firstUpper(spec.label ?? dataKey)
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value as number}
        onChange={(e) => onValueChange(Number(e.target.value))}
        step={spec.step ?? 0.001}
      />
    </label>
  );
};
