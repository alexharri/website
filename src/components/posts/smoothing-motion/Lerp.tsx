import { useState } from "react";
import { MathSVG } from "../../../threejs/MathSVG";
import { StyleOptions, useStyles } from "../../../utils/styles";

const MARGIN = 32;
const W = 50;

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    margin: 0 auto;
    max-width: 100%;
    width: 500px;
  `,

  slider: styled.css`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    gap: 16px;

    span {
      svg {
        margin-bottom: 4px;
      }

      display: flex;
      gap: 4px;
      align-items: center;
      width: 64px;
      font-size: 18px;
    }

    input {
      width: 156px;
    }
  `,

  canvas: styled.css`
    margin: 0 auto;
    max-width: 100%;
    width: 450px;
    height: ${W + MARGIN * 2}px;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
  `,

  inner: styled.css`
    position: absolute;
    top: 0;
    left: ${MARGIN}px;
    bottom: 0;
    right: ${MARGIN}px;
  `,

  shadow: styled.css`
    width: ${W}px;
    height: ${W}px;
    border-radius: 50%;
    background: ${theme.background200};
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.medium700};

    &--start {
      left: 0;
    }
    &--end {
      right: 0;
    }
  `,

  circle: styled.css`
    width: ${W}px;
    height: ${W}px;
    border-radius: 50%;
    background: ${theme.text400};
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  `,
});

function style(t: number) {
  return { left: t * 100 + "%", transform: `translate(-${t * 100}%, -50%)` };
}

export const Lerp = () => {
  const s = useStyles(styles);
  const [t, setT] = useState(0);
  return (
    <div className={s("container")}>
      <div className={s("canvas")}>
        <div className={s("inner")}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div key={t} className={s("shadow")} style={style(t)}>
              {t}
            </div>
          ))}
          <div className={s("circle")} style={style(t)} />
        </div>
      </div>

      <div className={s("slider")}>
        <span>
          <MathSVG label="t" />
          =&nbsp;{t.toFixed(2)}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          step={0.01}
        />
      </div>
    </div>
  );
};
