import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { Renderer } from "./Renderer";
import { gradients } from "./gradients";

const W = 1200;
const H = 350;

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    border: 1px solid ${theme.blue};
    width: ${W + 16}px;
    height: ${H + 16}px;
    padding: 7px;
    border-radius: 4px;
    margin: 0 auto;
  `,
});

export const TestCanvas = () => {
  const s = useStyles(styles);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const renderer = new Renderer(canvas, gradients.default, W, H);

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
