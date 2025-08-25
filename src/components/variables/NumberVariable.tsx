import { useMemo, useState } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { MathSVG } from "./MathSVG";
import { lerp } from "../../math/lerp";
import { clamp } from "../../math/math";
import { cssVariables } from "../../utils/cssVariables";
import { useIsMobile } from "../../utils/hooks/useViewportWidth";
import { NumberVariableSpec } from "../../types/variables";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

function format(value: number, step: number, format: NumberVariableSpec["format"]): string {
  if (format === "percent") {
    return Math.round(value * 100) + "%";
  }
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
  let postfix = format === "multiplier" ? "x" : "";
  return Number(value.toFixed(digits)) + postfix;
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
    transition: opacity 0.3s, transform 0.1s, top 0.1s;

    @media (max-width: ${cssVariables.mobileWidth}px) {
      bottom: initial;
      top: -8px;
      transform-origin: 50% 100%;
    }

    &--left,
    &--right {
      @media (max-width: ${cssVariables.mobileWidth}px) {
        top: -8px;
      }
    }
    @media (max-width: ${cssVariables.mobileWidth}px) {
      &--left&--down,
      &--right&--down {
        top: -15px !important;
      }
    }

    &--value {
      background: linear-gradient(
        90deg,
        transparent 0%,
        ${theme.background} 33%,
        ${theme.background} 66%,
        transparent 100%
      );
      z-index: 101;
      padding: 0 32px;

      @media (max-width: ${cssVariables.mobileWidth}px) {
        opacity: 0.7;
      }
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

      @media (max-width: ${cssVariables.mobileWidth}px) {
        transform: translate(-50%, -50%) translateY(-6px) scale(1.2);
      }
    }
  `,
});

export type { NumberVariableSpec } from "../../types/variables";

interface NumberVariableProps {
  dataKey: string;
  value: number;
  onValueChange: (value: number) => void;
  spec: Omit<NumberVariableSpec, "type">;
  showValue?: boolean;
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
  const { dataKey, spec, value, onValueChange, showValue = true } = props;
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

  const isMobile = useIsMobile();

  const ldist = t;
  const rdist = 1 - t;
  let lOpacity = clamp(ldist * 12 - 3, 0, 1);
  let rOpacity = clamp(rdist * 12 - 3, 0, 1);
  if (!down && !(hover && !isMobile)) {
    lOpacity = 0;
    rOpacity = 0;
  }
  if (isMobile) {
    lOpacity *= 0.7;
    rOpacity *= 0.7;
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
        onTouchStart={() => setDown(true)}
        onTouchEnd={() => setDown(false)}
      >
        <input
          type="range"
          min={min}
          max={max}
          value={value as number}
          onChange={(e) => onValueChange(Number(e.target.value))}
          step={step}
        />
        {showValue && (
          <>
            <span className={s("label", { left: true, down })} style={{ opacity: lOpacity }}>
              {format(min, step, spec.format)}
            </span>
            <span className={s("label", { right: true, down })} style={{ opacity: rOpacity }}>
              {format(max, step, spec.format)}
            </span>
            <span
              className={s("label", { value: true, down, hover })}
              style={{ left: `calc(${lerp(11, -11, t)}px + ${t * 100}%)` }}
            >
              {format(value, step, spec.format)}
            </span>
          </>
        )}
      </div>
    </label>
  );
};
