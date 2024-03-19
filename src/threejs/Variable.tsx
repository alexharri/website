const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

export type NumberVariableSpec = {
  label?: string;
  type: "number";
  range: [number, number];
  value: number;
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

  let svgLabel: string | undefined;

  if (spec.label) {
    const el = document.querySelector(`[data-varlabel="${spec.label}"]`);
    if (el) svgLabel = el.innerHTML;
  }

  return (
    <label>
      {svgLabel ? (
        <span style={{ fontSize: 24 }} dangerouslySetInnerHTML={{ __html: svgLabel }} />
      ) : (
        firstUpper(dataKey)
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value as number}
        onChange={(e) => onValueChange(Number(e.target.value))}
        step={0.1}
      />
    </label>
  );
};
