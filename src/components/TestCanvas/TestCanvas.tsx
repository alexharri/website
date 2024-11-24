import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { Renderer } from "./Renderer";
import { colorConfigurations } from "./colorConfigurations";

const W = 1200;
const H = 250;

const styles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    width: ${W}px;
    height: ${H}px;
    border-radius: 4px;
    margin: 40px auto;

    canvas {
      border-radius: 8px;
    }
  `,
});

interface Props {
  colorConfiguration: keyof typeof colorConfigurations;
}

export const TestCanvas: React.FC<Props> = (props) => {
  const s = useStyles(styles);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const colorConfig =
      colorConfigurations[props.colorConfiguration] ?? colorConfigurations.default;

    const renderer = new Renderer(canvas, colorConfig, W, H);

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
