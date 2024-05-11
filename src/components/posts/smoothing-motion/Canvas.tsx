type CreateInterpolateFn = () => (x: number, y: number) => [number, number];

import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  canvas: styled.css`
    margin: 0 auto;
    max-width: 100%;
    width: 450px;
    height: 300px;
    border-radius: 8px;
    overflow: hidden;
    background: ${theme.background500};
    position: relative;
  `,

  element: styled.css`
    width: 40px;
    height: 40px;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: ${theme.text400};
  `,
});

export function createCanvas(createInterpolateFn: CreateInterpolateFn): React.FC {
  const interpolate = createInterpolateFn();

  function transform(x: number, y: number) {
    return `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  const Canvas = () => {
    const s = useStyles(styles);

    const posRef = useRef({ x: 100, y: 100 });
    const targetRef = useRef({ x: 100, y: 100 });

    const containerRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      let stop = false;
      const tick = () => {
        if (stop) return;
        requestAnimationFrame(tick);

        const currPos = posRef.current;
        const targetPos = targetRef.current;
        const result = interpolate(targetPos.x, targetPos.y);
        currPos.x = result[0];
        currPos.y = result[1];

        const circle = circleRef.current;
        if (!circle) return;
        circle.style.transform = transform(currPos.x, currPos.y);
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

      e.stopPropagation();
      e.preventDefault();

      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      targetRef.current.x = clientX - rect.left;
      targetRef.current.y = clientY - rect.top;
    }

    const onDown = (e: React.MouseEvent | React.TouchEvent) => {
      update(e);

      function onUp() {
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
      <div className={s("canvas")} onMouseDown={onDown} onTouchStart={onDown} ref={containerRef}>
        <div
          className={s("element")}
          ref={circleRef}
          style={{ transform: transform(posRef.current.x, posRef.current.y) }}
        />
      </div>
    );
  };

  return Canvas;
}
