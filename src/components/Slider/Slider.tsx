import { StyleOptions, useStyles } from "../../utils/styles";

const styles = ({ styled }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    gap: 16px;
    align-items: center;
  `,
});

interface Props {
  label?: string;
  value: number;
  setValue: (value: number) => void;
  range: [number, number];
  step?: number;
}

export const Slider: React.FC<Props> = (props) => {
  const s = useStyles(styles);
  const [min, max] = props.range;
  return (
    <label className={s("wrapper")}>
      {props.label && <span>{props.label}</span>}

      <input
        type="range"
        min={min}
        max={max}
        value={props.value}
        onChange={(e) => props.setValue(Number(e.target.value))}
        step={props.step ?? 0.1}
      />
    </label>
  );
};
