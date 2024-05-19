type CreateNoiseFn = () => () => [number, number];

import { useEffect, useRef } from "react";
import { lerp } from "../../../../math/lerp";
import { clamp } from "../../../../math/math";
import { colors } from "../../../../utils/cssVariables";
import { useRAF } from "../../../../utils/hooks/useRAF";
import { StyleOptions, useStyles } from "../../../../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  canvas: styled.css`
    margin: 0 auto;
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
    cursor: pointer;
    touch-action: none;

    &--margin {
      margin: 40px auto;
    }
  `,

  element: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 12px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: ${theme.text};
    z-index: 3;
    width: 80px;
    height: 80px;
    border-radius: 50%;
  `,

  snapped: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 4px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: #2c9e9d;
    z-index: 2;
  `,

  label: styled.css`
    color: ${theme.blue};
    font-size: 16px;
    position: absolute;
    z-index: 5;
  `,

  svg: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 4;
  `,

  guide: styled.css`
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    transform: translateX(-50%);
    background: ${theme.blue};
    border: 1px solid ${theme.background500};
    border-top: none;
    border-bottom: none;
    z-index: 10;
    box-shadow: 0 0 8px 2px rgba(0, 0, 0, 0.1);
  `,
});

const CANVAS_W = 450;
const CANVAS_H = 300;
const SNAPPED_W = 200;
const SNAPPED_H = 150;
const SNAPPED_Y = CANVAS_H * 0.6;
const DOT_Y = CANVAS_H * 0.6;
const GUIDE_LABEL_Y = CANVAS_H * 0.6;
const GUIDE1_X = 96;
const GUIDE2_X = CANVAS_W - 96;
const CLAMP_FAC = 0.4;

const createInterpolateX = () => {
  let prev: number | null = null;
  let prevT = 0;
  return (x: number): number => {
    prev ??= x;
    const dist = Math.abs(prev - x);
    const targetT = 0.1 + dist * 0.006;
    prevT = lerp(prevT, targetT, 0.1);
    prev = lerp(prev, x, prevT);
    return prev;
  };
};

const createInterpolateSnappedX = () => {
  let prev: number | null = null;
  return (x: number): number => {
    prev ??= x;
    const dist = Math.abs(prev - x);
    const t = 0.15 + dist * 0.002;
    prev = lerp(prev, x, t);
    return prev;
  };
};

export function createGuideExample(
  createNoiseFn: CreateNoiseFn,
  { margin = false }: { margin?: boolean } = {},
): React.FC {
  const noise = createNoiseFn();
  const interpolateX = createInterpolateX();
  const interpolateSnappedX = createInterpolateSnappedX();

  function transform(x: number, y: number, scale = 1) {
    return `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
  }

  const Component = () => {
    const s = useStyles(styles);

    const snappedCurrPosRef = useRef(CANVAS_W / 2);
    const elementCurrPosRef = useRef(CANVAS_W * CLAMP_FAC);
    const elementTargetPosRef = useRef(CANVAS_W * CLAMP_FAC);
    const elementScaleRef = useRef(1);
    const elementOpacityRef = useRef(1);
    const downRef = useRef(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRef = useRef<HTMLDivElement>(null);
    const snappedRef = useRef<HTMLDivElement>(null);

    useRAF(() => {
      const element = elementRef.current;
      const snapped = snappedRef.current;
      if (!element || !snapped) return;

      elementCurrPosRef.current = interpolateX(elementTargetPosRef.current);

      const [noiseX, noiseY] = noise();
      elementCurrPosRef.current += noiseX;

      const isMobile = window.innerWidth < 500;

      if (isMobile) {
        elementScaleRef.current = lerp(elementScaleRef.current, downRef.current ? 0.8 : 0.15, 0.2);
        elementOpacityRef.current = lerp(elementOpacityRef.current, downRef.current ? 0.3 : 1, 0.2);
        element.style.opacity = String(elementOpacityRef.current);
      } else {
        elementScaleRef.current = lerp(elementScaleRef.current, downRef.current ? 0.3 : 0.15, 0.2);
      }

      element.style.transform = transform(
        elementCurrPosRef.current,
        DOT_Y + noiseY,
        elementScaleRef.current,
      );

      const leftEdgePos = elementCurrPosRef.current - SNAPPED_W / 2;
      const rightEdgePos = elementCurrPosRef.current + SNAPPED_W / 2;

      const guide1Dist = Math.abs(leftEdgePos - GUIDE1_X);
      const guide2Dist = Math.abs(rightEdgePos - GUIDE2_X);

      const targetSnappedX =
        guide1Dist < guide2Dist ? GUIDE1_X + SNAPPED_W / 2 : GUIDE2_X - SNAPPED_W / 2;
      snappedCurrPosRef.current = interpolateSnappedX(targetSnappedX);
      snapped.style.transform = transform(snappedCurrPosRef.current, SNAPPED_Y);
    });

    function update(e: MouseEvent | TouchEvent) {
      const canvas = containerRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { clientX } = "touches" in e ? e.touches[0] : e;
      elementTargetPosRef.current = clamp(CANVAS_W * 0.4, CANVAS_W * 0.6, clientX - rect.left);
    }

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      update(e);
      downRef.current = true;

      function onUp() {
        downRef.current = false;
        window.removeEventListener("mousemove", update);
        window.removeEventListener("touchmove", update);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchend", onUp);
      }

      window.addEventListener("mousemove", update);
      window.addEventListener("touchmove", update);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    };

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener("mousedown", onDown);
      container.addEventListener("touchstart", onDown);

      return () => {
        container.removeEventListener("mousedown", onDown);
        container.removeEventListener("touchstart", onDown);
      };
    }, []);

    return (
      <div
        className={s("canvas", { margin })}
        ref={containerRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        <div
          className={s("element")}
          ref={elementRef}
          style={{
            transform: transform(elementCurrPosRef.current, DOT_Y),
            width: 64,
            height: 64,
          }}
        />

        <div
          className={s("snapped")}
          ref={snappedRef}
          style={{
            transform: transform(snappedCurrPosRef.current, SNAPPED_Y),
            width: SNAPPED_W,
            height: SNAPPED_H,
          }}
        />

        <div
          className={s("label")}
          style={{
            transform: "translate(-50%, -50%)",
            top: GUIDE_LABEL_Y,
            left: GUIDE1_X - 40,
            color: colors.text,
          }}
        >
          Guide 1
        </div>
        <div
          className={s("label")}
          style={{
            transform: "translate(-50%, -50%)",
            top: GUIDE_LABEL_Y,
            left: GUIDE2_X + 40,
            color: colors.text,
          }}
        >
          Guide 2
        </div>
        <div
          className={s("label")}
          style={{
            transform: "translate(-50%, -50%) ",
            top: 42,
            left: CANVAS_W / 2,
            color: colors.text,
          }}
        >
          Boundary
        </div>

        <div style={{ left: GUIDE1_X }} className={s("guide")} />
        <div style={{ left: GUIDE2_X }} className={s("guide")} />
        <svg
          className={s("svg")}
          width={CANVAS_W}
          height={CANVAS_H}
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1={CANVAS_W / 2}
            x2={CANVAS_W / 2}
            y1={14}
            y2={22}
            strokeWidth={2}
            stroke={colors.text}
          />
          <line
            x1={CANVAS_W / 2}
            x2={CANVAS_W / 2}
            y1={64}
            y2={CANVAS_H}
            strokeDasharray="8 22"
            strokeDashoffset={0}
            strokeWidth={2}
            stroke={colors.text}
          />
        </svg>
      </div>
    );
  };

  return Component;
}
