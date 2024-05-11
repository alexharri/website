import { useEffect, useRef } from "react";
import { createWiggle } from "../../../math/wiggle";
import { useStateRef } from "../../../utils/hooks/useStateRef";
import { StyleOptions, useStyles } from "../../../utils/styles";
import { Slider } from "../../Slider/Slider";

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  `,

  canvas: styled.css`
    width: 300px;
    height: 200px;
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
    touch-action: none;
  `,

  element: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: ${theme.text};
    width: 32px;
    height: 32px;
  `,

  sliders: styled.css`
    display: flex;
    gap: 16px;
  `,
});

function transform(x: number, y: number) {
  return `translate(${x}px, ${y}px) translate(-50%, -50%)`;
}

export const NoiseComponent = () => {
  const s = useStyles(styles);

  const elementRef = useRef<HTMLDivElement>(null);

  const [amplitude, setAmplitude, amplitudeRef] = useStateRef(3);
  const [speed, setSpeed, speedRef] = useStateRef(3);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const wiggleX = createWiggle();
    const wiggleY = createWiggle();

    let stop = false;
    const tick = () => {
      if (stop) return;
      requestAnimationFrame(tick);
      const amplitude = amplitudeRef.current;
      const speed = speedRef.current;
      el.style.transform = transform(wiggleX(speed, amplitude), wiggleY(speed, amplitude));
    };
    tick();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <div className={s("wrapper")}>
      <div className={s("canvas")}>
        <div className={s("element")} ref={elementRef} />
      </div>

      <div className={s("sliders")}>
        <Slider label="Amplitude" value={amplitude} setValue={setAmplitude} range={[1, 10]} />
        <Slider label="Speed" value={speed} setValue={setSpeed} range={[0.5, 7]} />
      </div>
    </div>
  );
};
