type CreateNoiseFn = () => () => [number, number];

import { useEffect, useRef } from "react";
import { lerp } from "../../../../math/lerp";
import { clamp } from "../../../../math/math";
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
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2);
  `,

  scoreContainer: styled.css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: 24px auto 0;
    width: 300px;
    max-width: 100%;
  `,

  score: styled.css`
    position: relative;
    width: 0px;
    height: 28px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    border-radius: 4px;
    transition: border-radius 0.3s, border 0.3s;

    &--left {
      background: #0368ca;
      &[data-active="true"] {
        border-right: 1px solid #b5eaff;
      }
    }
    &--right {
      background: #c12b13;
      &[data-active="true"] {
        border-right: 1px solid #ffbe9d;
      }
    }

    span {
      display: block;
      padding: 0 8px;
    }

    &[data-active="true"] {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;

      & [data-highlight] {
        opacity: 1;
      }
    }
  `,

  scoreBoost: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    border-radius: 4px;
    z-index: -1;
    transition: border-width 0.3s;

    &--left {
      background: #3890e8;
      border: 0px solid #b5eaff;
      &[data-active="true"] {
        border-width: 1px;
      }
    }
    &--right {
      background: #e7553e;
      border: 0px solid #ffbe9d;
      &[data-active="true"] {
        border-width: 1px;
      }
    }

    & > [data-highlight] {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      /* box-shadow: 0 0 0 1px #b5eaff, 0 0 0 3px #4c82b1, 0 0 0 5px #1c355a; */
      z-index: -5;
      border-radius: 4px;
      border-top-left-radius: 1px;
      border-bottom-left-radius: 1px;
      opacity: 0;
      transition: opacity 0.3s;
    }
  `,

  svg: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 4;
  `,

  side: styled.css`
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;

    &:before {
      content: "";
      opacity: 0;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transition: opacity 0.5s;
    }

    &[data-active="true"]:before {
      transition: opacity 0.15s;
      opacity: 1;
    }
  `,

  line: styled.css`
    position: absolute;
    top: 0;
    bottom: 1px;
    background: rgba(255, 255, 255, 0.6);
    width: 2px;
    z-index: 2;
  `,

  left: styled.css`
    left: 0;
    right: 50%;
    background: linear-gradient(
      90deg,
      hsl(223deg 75% 16%) 0%,
      hsl(221deg 75% 17%) 11%,
      hsl(220deg 75% 18%) 22%,
      hsl(218deg 75% 19%) 33%,
      hsl(217deg 75% 20%) 44%,
      hsl(215deg 76% 21%) 56%,
      hsl(214deg 76% 22%) 67%,
      hsl(212deg 77% 23%) 78%,
      hsl(211deg 78% 24%) 89%,
      hsl(210deg 80% 25%) 100%
    );

    &:before {
      background: linear-gradient(
        90deg,
        hsl(230deg 87% 31%) 0%,
        hsl(222deg 100% 31%) 10%,
        hsl(218deg 100% 34%) 20%,
        hsl(214deg 100% 36%) 30%,
        hsl(211deg 100% 38%) 40%,
        hsl(209deg 93% 42%) 50%,
        hsl(206deg 100% 42%) 60%,
        hsl(204deg 100% 44%) 70%,
        hsl(203deg 100% 46%) 80%,
        hsl(201deg 100% 47%) 90%,
        hsl(200deg 94% 51%) 100%
      );
    }

    &--showGap {
      border-right: 3px solid ${theme.background};
    }
  `,

  right: styled.css`
    left: 50%;
    right: 0;
    background: linear-gradient(
      270deg,
      hsl(353deg 76% 17%) 0%,
      hsl(355deg 74% 17%) 11%,
      hsl(358deg 71% 18%) 22%,
      hsl(0deg 69% 19%) 33%,
      hsl(3deg 72% 19%) 44%,
      hsl(6deg 75% 19%) 56%,
      hsl(9deg 78% 19%) 67%,
      hsl(11deg 82% 19%) 78%,
      hsl(14deg 86% 19%) 89%,
      hsl(16deg 90% 19%) 100%
    );

    &:before {
      background: linear-gradient(
        270deg,
        hsl(346deg 87% 31%) 0%,
        hsl(351deg 81% 35%) 10%,
        hsl(356deg 74% 39%) 20%,
        hsl(2deg 73% 42%) 30%,
        hsl(8deg 81% 42%) 40%,
        hsl(15deg 93% 42%) 50%,
        hsl(18deg 93% 44%) 60%,
        hsl(21deg 92% 46%) 70%,
        hsl(23deg 90% 48%) 80%,
        hsl(25deg 89% 50%) 90%,
        hsl(27deg 95% 52%) 100%
      );
    }

    &--showGap {
      border-left: 3px solid ${theme.background};
    }
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
const CLAMP_FAC = 0.1;
const TARGET_X = CANVAS_W * CLAMP_FAC;

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

export function createOptionExample(
  createNoiseFn: CreateNoiseFn,
  options: { margin?: boolean; showScores?: boolean; stickiness?: number; showGap?: boolean } = {},
) {
  const { margin = false, showScores = false, showGap = false } = options;

  const noise = createNoiseFn();
  const interpolateX = createInterpolateX();

  function transform(x: number, y: number, scale = 1) {
    return `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
  }

  const CANVAS_H = 96;
  const DOT_Y = CANVAS_H * 0.5;

  const Component: React.FC<{ stickiness?: number }> = (props) => {
    const s = useStyles(styles);

    const stickiness = props.stickiness ?? options.stickiness ?? 0;
    const stickinessRef = useRef(stickiness);
    stickinessRef.current = stickiness;

    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);

    const leftScoreRef = useRef<HTMLDivElement>(null);
    const rightScoreRef = useRef<HTMLDivElement>(null);

    const leftScoreBoostRef = useRef<HTMLDivElement>(null);
    const rightScoreBoostRef = useRef<HTMLDivElement>(null);

    const elementCurrPosRef = useRef(CANVAS_W * CLAMP_FAC);
    const elementTargetPosRef = useRef(CANVAS_W * CLAMP_FAC);
    const elementScaleRef = useRef(1);
    const elementOpacityRef = useRef(1);
    const downRef = useRef(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    const lastBetterRef = useRef<"left" | "right" | undefined>(undefined);
    const tBetterRef = useRef(0);

    useRAF(() => {
      const element = elementRef.current;
      const left = leftRef.current;
      const right = rightRef.current;
      if (!element || !left || !right) return;

      const stickiness = stickinessRef.current;

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

      const totalScore = 100 * (1 / (1 + stickiness));
      let rightScore =
        totalScore -
        (1 - (elementCurrPosRef.current - TARGET_X) / (CANVAS_W - TARGET_X * 2)) * totalScore;
      let leftScore = totalScore - rightScore;

      leftScore = Math.max(leftScore, 0);
      rightScore = Math.max(rightScore, 0);

      // Visualize pre-boost
      const leftScoreEl = leftScoreRef.current;
      const rightScoreEl = rightScoreRef.current;
      if (leftScoreEl && rightScoreEl) {
        leftScoreEl.style.width = `${leftScore}%`;
        rightScoreEl.style.width = `${rightScore}%`;
      }

      if (lastBetterRef.current === "left") leftScore *= 1 + stickiness;
      else if (lastBetterRef.current === "right") rightScore *= 1 + stickiness;

      const better = leftScore > rightScore ? "left" : "right";
      lastBetterRef.current = better;

      tBetterRef.current = lerp(tBetterRef.current, better === "left" ? 0 : 1, 0.15);

      if (leftScoreEl && rightScoreEl) {
        const [activeScore, notActiveScore] =
          better === "left" ? [leftScoreEl, rightScoreEl] : [rightScoreEl, leftScoreEl];
        activeScore.setAttribute("data-active", "true");
        notActiveScore.removeAttribute("data-active");
      }

      const leftScoreBoostEl = leftScoreBoostRef.current;
      const rightScoreBoostEl = rightScoreBoostRef.current;
      if (leftScoreBoostEl && rightScoreBoostEl) {
        leftScoreBoostEl.style.width = `${(1 + stickiness * (1 - tBetterRef.current)) * 100}%`;
        rightScoreBoostEl.style.width = `${(1 + stickiness * tBetterRef.current) * 100}%`;
      }

      if (leftScoreBoostEl && rightScoreBoostEl) {
        const [activeScoreBoost, notActiveScoreBoost] =
          better === "left"
            ? [leftScoreBoostEl, rightScoreBoostEl]
            : [rightScoreBoostEl, leftScoreBoostEl];
        activeScoreBoost.setAttribute("data-active", "true");
        notActiveScoreBoost.removeAttribute("data-active");
      }

      const [active, notActive] = better === "left" ? [left, right] : [right, left];
      active.setAttribute("data-active", "true");
      notActive.removeAttribute("data-active");
    });

    function update(e: MouseEvent | TouchEvent) {
      const canvas = containerRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { clientX } = "touches" in e ? e.touches[0] : e;
      elementTargetPosRef.current = clamp(
        CANVAS_W * CLAMP_FAC,
        CANVAS_W * (1 - CLAMP_FAC),
        clientX - rect.left,
      );
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

    const boundaryT = stickiness / (2 + stickiness);
    const fac = (CANVAS_W - CANVAS_W * CLAMP_FAC * 2) / CANVAS_W;
    const tAdj = boundaryT * fac;
    const sidePercentage = showGap ? 50 + 50 * tAdj : 50;

    return (
      <div>
        <div
          className={s("canvas", { margin })}
          ref={containerRef}
          style={{ width: CANVAS_W, height: CANVAS_H }}
        >
          <div
            className={[s("side"), s("left", { showGap })].join(" ")}
            style={{ right: sidePercentage + "%" }}
            ref={leftRef}
          />
          <div
            className={[s("side"), s("right", { showGap })].join(" ")}
            style={{ left: sidePercentage + "%" }}
            ref={rightRef}
          />

          <div className={s("line", { left: true })} style={{ left: TARGET_X }} />
          <div className={s("line", { right: true })} style={{ right: TARGET_X }} />

          <div
            className={s("element")}
            ref={elementRef}
            style={{
              transform: transform(elementCurrPosRef.current, DOT_Y),
              width: 64,
              height: 64,
            }}
          />
        </div>
        {showScores && (
          <div className={s("scoreContainer")}>
            <div className={s("score", { left: true })} ref={leftScoreRef}>
              <span>Left score</span>
              <div className={s("scoreBoost", { left: true })} ref={leftScoreBoostRef}>
                <div
                  data-highlight
                  style={{ width: (1 / (1 + stickiness)) * stickiness * 100 + "%" }}
                />
              </div>
            </div>
            <div className={s("score", { right: true })} ref={rightScoreRef}>
              <span>Right score</span>
              <div className={s("scoreBoost", { right: true })} ref={rightScoreBoostRef}>
                <div
                  data-highlight
                  style={{ width: (1 / (1 + stickiness)) * stickiness * 100 + "%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return Component;
}
