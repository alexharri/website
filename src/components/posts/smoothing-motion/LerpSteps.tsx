import { useState } from "react";
import { lerp } from "../../../math/lerp";
import { MathSVG } from "../../../threejs/MathSVG";
import { StyleOptions, useStyles } from "../../../utils/styles";

const MARGIN = 32;
const W = 10;

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    margin: 40px auto;
    max-width: 100%;
    width: 500px;
  `,

  sliders: styled.css`
    display: flex;
    gap: 32px;
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
      width: 80px;
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
    padding: ${MARGIN}px 0;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
  `,

  inner: styled.css`
    position: relative;
    height: 20px;
    margin: 0 ${MARGIN}px 0 ${MARGIN * 2}px;
  `,

  shadow: styled.css`
    width: ${W}px;
    height: ${W}px;
    border-radius: 50%;
    background: ${theme.text400};
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

  frame: styled.css`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: calc(100% + 24px);
    display: flex;
    height: 20px;
    line-height: 20px;
  `,
});

function style(t: number) {
  return { left: t * 100 + "%", transform: `translate(-${t * 100}%, -50%)` };
}

export const LerpSteps = () => {
  const s = useStyles(styles);
  const [N, setN] = useState(25);
  const [tPerFrame, setTPerFrame] = useState(0.1);
  const arr: number[] = [];
  let t = 0;
  for (let i = 0; i < N; i++) {
    arr.push(t);
    t = lerp(t, 1, tPerFrame);
  }
  const targetHeight = 400;
  return (
    <div className={s("container")}>
      <div className={s("canvas")}>
        {arr.map((t, i) => {
          const showFrame = N > 25 ? i % 2 === 0 : true;
          const fadeOpacity = N > 18 ? i % 2 === 1 : true;
          let opacity = 1;
          if (fadeOpacity) {
            opacity = Math.max(0, 1 - (N - 18) / 10);
          }
          console.log(i, opacity);
          return (
            <div key={t} className={s("inner")} style={{ height: targetHeight / N }}>
              {showFrame && (
                <div className={s("frame")} style={{ opacity }}>
                  {i + 1}
                </div>
              )}
              <div className={s("shadow")} style={style(t)} />
            </div>
          );
        })}
      </div>
      <div className={s("sliders")}>
        <div className={s("slider")}>
          <span>Steps: {N}</span>
          <input
            type="range"
            min={15}
            max={40}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
            step={1}
          />
        </div>
        <div className={s("slider")}>
          <span>
            <MathSVG label="t" />: {tPerFrame.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.075}
            max={0.3}
            value={tPerFrame}
            onChange={(e) => setTPerFrame(Number(e.target.value))}
            step={0.01}
          />
        </div>
      </div>
    </div>
  );
};
