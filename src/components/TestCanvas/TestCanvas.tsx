import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { Renderer } from "./Renderer";
import { gradients } from "./gradients";

const W = 1200;
const H = 250;

const styles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    width: ${W}px;
    height: ${H}px;
    border-radius: 4px;
    margin: 0 auto;

    canvas {
      border-radius: 8px;
    }
  `,
});

export const TestCanvas = () => {
  const s = useStyles(styles);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const renderer = new Renderer(canvas, gradients.blue2, "#f26bff", W, H);

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      renderer.render();
    }
    tick();

    return () => (stop = true);
  }, []);

  return (
    <div className={s("container")}>
      <canvas ref={canvasRef} width={W} height={H} />
    </div>
  );
};
