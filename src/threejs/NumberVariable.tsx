import { useMemo, useState } from "react";
import { StyleOptions, useStyles } from "../utils/styles";
import { MathSVG } from "./MathSVG";
import { lerp } from "../math/lerp";
import { clamp } from "../math/math";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

function format(value: number, step: number) {
  let v = step;
  let digits = 0;
  while (v < 1) {
    v *= 10;
    digits++;
    if (digits > 4) {
      // If this happens, I want to know about it.
      throw new Error(`Unexpectedly small step of ${step}`);
    }
  }
  return Number(value.toFixed(digits));
}

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,

  inputWrapper: styled.css`
    position: relative;

    &--widthSmall {
      input {
        width: 100px;
      }

      @media (max-width: 640px) {
        input {
          width: max(16vw, 80px);
        }
      }
    }
  `,

  label: styled.css`
    position: absolute;
    z-index: 100;
    opacity: 0;
    transform: translate(-50%, -50%);
    bottom: -32px;
    line-height: 1;
    transform-origin: 50% 0%;
    pointer-events: none;
    transition: opacity 0.3s, transform 0.1s;

    &--value {
      background: linear-gradient(
        90deg,
        transparent 0%,
        ${theme.background} 33%,
        ${theme.background} 66%,
        transparent 100%
      );
      z-index: 101;
      padding: 0 16px;
    }
    &--left {
      left: 11px;
    }
    &--right {
      right: 11px;
      transform: translate(50%, -50%);
    }

    &--hover,
    &--down {
      opacity: 1;
    }

    &--value&--down {
      transform: translate(-50%, -50%) scale(1.2);
    }
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
  spec: {
    range: [number, number];
    value: number;
    step?: number;
    label?: string;
  };
  width?: "small" | "normal";
}

function defaultStep(min: number, max: number) {
  let delta = max - min;
  let v = delta / 10;
  let step = 100;
  while (v / step < 1 && step > 0.001) {
    step *= 0.1;
  }
  return step;
}

export const NumberVariable: React.FC<NumberVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange } = props;
  const [min, max] = spec.range;

  const s = useStyles(styles);

  const svgLabel = useMemo(() => {
    if (spec.label && spec.label.startsWith("math:")) {
      const [_, label] = spec.label.split("math:");
      return <MathSVG label={label} />;
    }
    return null;
  }, [spec.label]);

  const [down, setDown] = useState(false);
  const [hover, setHover] = useState(false);

  const t = (value - min) / (max - min);
  const step = spec.step ?? defaultStep(min, max);

  const ldist = t;
  const rdist = 1 - t;
  let lOpacity = clamp(ldist * 12 - 3, 0, 1);
  let rOpacity = clamp(rdist * 12 - 3, 0, 1);
  if (!down && !hover) {
    lOpacity = 0;
    rOpacity = 0;
  }

  return (
    <label className={s("wrapper")}>
      {svgLabel || firstUpper(spec.label ?? dataKey)}
      <div
        className={s("inputWrapper", { widthSmall: props.width === "small" })}
        onMouseDown={() => setDown(true)}
        onMouseUp={() => setDown(false)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <input
          type="range"
          min={min}
          max={max}
          value={value as number}
          onChange={(e) => onValueChange(Number(e.target.value))}
          step={step}
        />
        <span className={s("label", { left: true, down, hover })} style={{ opacity: lOpacity }}>
          {min}
        </span>
        <span className={s("label", { right: true, down, hover })} style={{ opacity: rOpacity }}>
          {max}
        </span>
        <span
          className={s("label", { value: true, down, hover })}
          style={{ left: `calc(${lerp(11, -11, t)}px + ${t * 100}%)` }}
        >
          {format(value, step)}
        </span>
      </div>
    </label>
  );
};
