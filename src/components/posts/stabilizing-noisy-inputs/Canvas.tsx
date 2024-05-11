type CreateNoiseFn = () => () => [number, number];

import { useEffect, useRef } from "react";
import { lerp } from "../../../math/lerp";
import { distance } from "../../../math/math";
import { StyleOptions, useStyles } from "../../../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  canvas: styled.css`
    margin: 0 auto;
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
    touch-action: none;
  `,

  element: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 12px;
    transform: translate(-50%, -50%);
    pointer-events: none;

    &--main {
      background: ${theme.text400};
      z-index: 2;
    }

    &--shadow {
      background: ${theme.text};
      z-index: 3;
      width: 8px;
      height: 8px;
    }

    &--position {
      background: ${theme.medium400};
      z-index: 1;
    }
  `,
});

const W = 64;
const GAP = 40;
const CANVAS_W = 450;
const CANVAS_H = 300;

const createInterpolateElement = () => {
  let prev: { x: number; y: number } | null = null;
  let prevT = 0;
  return (x: number, y: number): [number, number] => {
    prev ??= { x, y };

    const dist = distance(prev, { x, y });
    const targetT = 0.1 + dist * 0.006;
    prevT = lerp(prevT, targetT, 0.1);

    prev.x = lerp(prev.x, x, prevT);
    prev.y = lerp(prev.y, y, prevT);
    return [prev.x, prev.y];
  };
};

const createInterpolateSnapped = () => {
  let prev: { x: number; y: number } | null = null;
  let followingFac = 0;
  return (x: number, y: number, following: boolean): [number, number] => {
    prev ??= { x, y };

    if (!following) {
      followingFac = 0;
    } else {
      followingFac = lerp(followingFac, 1, 0.03);
    }

    const dist = distance(prev, { x, y });
    const t = 0.15 + dist * 0.0005;

    prev.x = lerp(prev.x, x, t);
    prev.y = lerp(prev.y, y, t);

    prev.x = lerp(prev.x, x, followingFac);
    prev.y = lerp(prev.y, y, followingFac);

    return [prev.x, prev.y];
  };
};

export function createCanvas(createNoiseFn: CreateNoiseFn): React.FC {
  const noise = createNoiseFn();
  const interpolateElement = createInterpolateElement();
  const interpolateSnapped = createInterpolateSnapped();

  function transform(x: number, y: number, scale = 1) {
    return `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
  }

  const Canvas = () => {
    const s = useStyles(styles);

    const snappedCurrPosRef = useRef({ x: 100, y: 100 });

    const elementCurrPosRef = useRef({ x: 100, y: 100 });
    const elementTargetPosRef = useRef({ x: 100, y: 100 });
    const elementScaleRef = useRef(1);
    const elementOpacityRef = useRef(1);
    const downRef = useRef(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRef = useRef<HTMLDivElement>(null);
    const snappedRef = useRef<HTMLDivElement>(null);

    function position(xOff: number, yOff: number) {
      const x = CANVAS_W * 0.5 + (W + GAP) * xOff;
      const y = CANVAS_H * 0.5 + (W + GAP) * yOff;

      return { x, y };
    }

    const positions = [
      [-1, -0.5],
      [0, -0.5],
      [1, -0.5],
      [-1, 0.5],
      [0, 0.5],
      [1, 0.5],
    ].map(([xOff, yOff]) => position(xOff, yOff));

    useEffect(() => {
      let stop = false;
      const tick = () => {
        if (stop) return;
        requestAnimationFrame(tick);

        const element = elementRef.current;
        const snapped = snappedRef.current;
        if (!snapped || !element) return;

        const elementCurrPos = elementCurrPosRef.current;
        const elementTargetPos = elementTargetPosRef.current;

        const snappedCurrPos = snappedCurrPosRef.current;

        let bestPos: { x: number; y: number } | undefined;
        let bestDist = Infinity;

        const elementPos = interpolateElement(elementTargetPos.x, elementTargetPos.y);
        elementCurrPos.x = elementPos[0];
        elementCurrPos.y = elementPos[1];

        const [noiseX, noiseY] = noise();
        elementCurrPos.x += noiseX;
        elementCurrPos.y += noiseY;

        const isMobile = window.innerWidth < 500;

        if (isMobile) {
          elementScaleRef.current = lerp(elementScaleRef.current, downRef.current ? 7 : 1, 0.2);
          elementOpacityRef.current = lerp(
            elementOpacityRef.current,
            downRef.current ? 0.3 : 1,
            0.2,
          );
          element.style.opacity = String(elementOpacityRef.current);
        } else {
          elementScaleRef.current = lerp(elementScaleRef.current, downRef.current ? 2.5 : 1, 0.2);
        }

        element.style.transform = transform(
          elementCurrPos.x,
          elementCurrPos.y,
          elementScaleRef.current,
        );

        for (const pos of positions) {
          const dist = distance(elementCurrPos, pos);
          if (dist < bestDist) {
            bestPos = pos;
            bestDist = dist;
          }
        }

        const following = !bestPos;
        bestPos ??= elementCurrPos;

        const snappedPos = interpolateSnapped(bestPos.x, bestPos.y, following);
        snappedCurrPos.x = snappedPos[0];
        snappedCurrPos.y = snappedPos[1];
        snapped.style.transform = transform(snappedCurrPos.x, snappedCurrPos.y);
      };
      tick();
      return () => {
        stop = true;
      };
    }, []);

    function update(e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) {
      const canvas = containerRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      elementTargetPosRef.current.x = clientX - rect.left;
      elementTargetPosRef.current.y = clientY - rect.top;
    }

    const onDown = (e: React.MouseEvent | React.TouchEvent) => {
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

    return (
      <div
        className={s("canvas")}
        onMouseDown={onDown}
        onTouchStart={onDown}
        ref={containerRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        <div
          className={s("element", { main: true })}
          ref={snappedRef}
          style={{
            transform: transform(snappedCurrPosRef.current.x, snappedCurrPosRef.current.y),
            width: W,
            height: W,
          }}
        />
        <div
          className={s("element", { shadow: true })}
          ref={elementRef}
          style={{
            transform: transform(snappedCurrPosRef.current.x, snappedCurrPosRef.current.y),
          }}
        />
        {positions.map(({ x, y }, i) => {
          return (
            <div
              key={i}
              className={s("element", { position: true })}
              style={{ transform: transform(x, y), width: W, height: W }}
            />
          );
        })}
      </div>
    );
  };

  return Canvas;
}