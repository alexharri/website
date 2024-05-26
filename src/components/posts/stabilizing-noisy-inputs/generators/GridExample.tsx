type CreateNoiseFn = () => () => [number, number];

import { useEffect, useRef } from "react";
import { lerp } from "../../../../math/lerp";
import { distance } from "../../../../math/math";
import { colors } from "../../../../utils/cssVariables";
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

    &--main {
      background: linear-gradient(
        180deg,
        hsl(206deg 92% 41%) 0%,
        hsl(206deg 92% 40%) 15%,
        hsl(207deg 92% 39%) 25%,
        hsl(207deg 92% 39%) 35%,
        hsl(207deg 91% 38%) 43%,
        hsl(208deg 91% 38%) 52%,
        hsl(208deg 91% 37%) 61%,
        hsl(209deg 91% 36%) 70%,
        hsl(209deg 91% 36%) 82%,
        hsl(209deg 91% 35%) 100%
      );
      border: 1px solid #59b6eb;
      border-right-color: #3593d1;
      border-bottom-color: #3593d1;
      z-index: 2;
      /* border-radius: 6px; */
    }

    &--shadow {
      background: ${theme.text};
      z-index: 3;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      position: relative;
    }

    &--position {
      background: #111a21;
      border: 1px solid #3e5d76;
      border-bottom-color: #2d4355;
      border-right-color: #2d4355;
      box-shadow: -1px -1px 1px 0px ${theme.background}, 1px 1px 1px 0px ${theme.background};
      z-index: 1;
      background: linear-gradient(
        345deg,
        hsl(207deg 33% 12%) 0%,
        hsl(207deg 34% 12%) 15%,
        hsl(207deg 34% 11%) 25%,
        hsl(207deg 34% 11%) 35%,
        hsl(207deg 34% 11%) 43%,
        hsl(207deg 35% 11%) 52%,
        hsl(207deg 35% 10%) 61%,
        hsl(207deg 35% 10%) 70%,
        hsl(207deg 36% 10%) 82%,
        hsl(207deg 36% 10%) 100%
      );

      /* &:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0;
        border-radius: 11px;
        transition: opacity 0.3s;
        background: radial-gradient(
          hsl(210deg 55% 96%) 0%,
          hsl(210deg 71% 90%) 11%,
          hsl(210deg 75% 84%) 18%,
          hsl(209deg 77% 79%) 24%,
          hsl(209deg 85% 72%) 30%,
          hsl(211deg 98% 63%) 36%,
          hsl(209deg 100% 50%) 42%,
          hsl(219deg 100% 52%) 50%,
          hsl(224deg 84% 45%) 58%,
          hsl(221deg 100% 31%) 68%,
          hsl(222deg 100% 20%) 81%,
          hsl(231deg 100% 11%) 100%
        );
      } */

      /* &[data-active="true"] {
        &:before {
          opacity: 1;
        }
      } */
    }
  `,

  boundaries: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    overflow: visible;
    pointer-events: none;
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

export function createGridExample(
  createNoiseFn: CreateNoiseFn,
  { margin = false, showBoundaries = false }: { margin?: boolean; showBoundaries?: boolean } = {},
): React.FC {
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
        let bestIndex: number = -1;
        let bestDist = Infinity;

        const elementPos = interpolateElement(elementTargetPos.x, elementTargetPos.y);
        elementCurrPos.x = elementPos[0];
        elementCurrPos.y = elementPos[1];

        const [noiseX, noiseY] = noise();
        elementCurrPos.x += noiseX;
        elementCurrPos.y += noiseY;

        const isMobile = window.innerWidth < 500;

        if (isMobile) {
          elementScaleRef.current = lerp(elementScaleRef.current, downRef.current ? 0.8 : 0.1, 0.2);
          elementOpacityRef.current = lerp(
            elementOpacityRef.current,
            downRef.current ? 0.3 : 1,
            0.2,
          );
          element.style.opacity = String(elementOpacityRef.current);
        } else {
          elementScaleRef.current = lerp(
            elementScaleRef.current,
            downRef.current ? 0.25 : 0.1,
            0.2,
          );
        }

        element.style.transform = transform(
          elementCurrPos.x,
          elementCurrPos.y,
          elementScaleRef.current,
        );

        for (const [i, pos] of positions.entries()) {
          const dist = distance(elementCurrPos, pos);
          if (dist < bestDist) {
            bestPos = pos;
            bestDist = dist;
            bestIndex = i;
          }
        }

        const following = !bestPos;
        bestPos ??= elementCurrPos;

        const snappedPos = interpolateSnapped(bestPos.x, bestPos.y, following);
        snappedCurrPos.x = snappedPos[0];
        snappedCurrPos.y = snappedPos[1];
        snapped.style.transform = transform(snappedCurrPos.x, snappedCurrPos.y);

        const positionEls = containerRef.current?.querySelectorAll("[data-position]");
        for (const positionEl of positionEls || []) {
          const index = Number(positionEl.getAttribute("data-position"));
          if (index === bestIndex) {
            positionEl.setAttribute("data-active", "true");
          } else {
            positionEl.removeAttribute("data-active");
          }
        }
      };
      tick();
      return () => {
        stop = true;
      };
    }, []);

    function update(e: MouseEvent | TouchEvent) {
      const canvas = containerRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      elementTargetPosRef.current.x = clientX - rect.left;
      elementTargetPosRef.current.y = clientY - rect.top;
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

    const boundaryStyle = {
      strokeDasharray: "8 18",
      strokeDashoffset: 21,
      strokeWidth: 2,
      stroke: colors.medium700,
    };

    return (
      <div
        className={s("canvas", { margin })}
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
              data-position={i}
              style={{ transform: transform(x, y), width: W, height: W }}
            />
          );
        })}
        {showBoundaries && (
          <svg
            className={s("boundaries")}
            width={W * 3 + GAP * 2}
            height={W * 2 + GAP}
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1={W + GAP * 0.5}
              x2={W + GAP * 0.5}
              y1={-16}
              y2={W * 2 + GAP + 16}
              {...boundaryStyle}
            />
            <line
              x1={W * 2 + GAP * 1.5}
              x2={W * 2 + GAP * 1.5}
              y1={-16}
              y2={W * 2 + GAP + 16}
              {...boundaryStyle}
            />
            <line
              x1={-16}
              x2={W * 3 + GAP * 2 + 16}
              y1={W + GAP * 0.5}
              y2={W + GAP * 0.5}
              {...boundaryStyle}
            />
          </svg>
        )}
      </div>
    );
  };

  return Canvas;
}
