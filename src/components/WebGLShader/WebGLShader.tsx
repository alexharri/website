import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { Renderer } from "./Renderer";
import { colorConfigurations } from "./colorConfigurations";
import { vertexShaderRegistry } from "./shaders/vertexShaders";
import { fragmentShaderRegistry } from "./shaders/fragmentShaders";
import { cssVariables } from "../../utils/cssVariables";

const styles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    width: 100vw;
    margin: 40px -${cssVariables.contentPadding}px;
    display: flex;
    justify-content: center;

    canvas {
      border-radius: 0;
    }

    &--skew {
      margin: calc(32px + min(100vw, ${cssVariables.contentWidth}px) * 0.04) -${cssVariables.contentPadding}px
        calc(48px + min(100vw, ${cssVariables.contentWidth}px) * 0.04);
      transform: skewY(-6deg);
    }
  `,
});

interface Props {
  skew?: boolean;
  colorConfiguration: keyof typeof colorConfigurations;
  fragmentShader: string;
  fragmentShaderOptions?: Partial<Record<string, unknown>>;
  width?: number;
  height?: number;
}

export const WebGLShader: React.FC<Props> = (props) => {
  const s = useStyles(styles);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { skew = false, height = 250, width } = props;

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const colorConfig =
      colorConfigurations[props.colorConfiguration] ?? colorConfigurations.default;

    const vertexShader = vertexShaderRegistry.default!;

    const createFragmentShader = fragmentShaderRegistry[props.fragmentShader];
    if (!createFragmentShader)
      throw new Error(`Could not find '${props.fragmentShader}' fragment shader.`);

    const fragmentShader = createFragmentShader(props.fragmentShaderOptions ?? {});
    const renderer = new Renderer(canvas, vertexShader, fragmentShader, colorConfig);

    let resized = true;
    const resizeListener = () => {
      resized = true;
    };

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      if (resized) {
        renderer.setWidth(props.width ?? window.innerWidth);
      }
      renderer.render();
    }
    tick();

    window.addEventListener("resize", resizeListener);
    return () => {
      stop = true;
      window.removeEventListener("resize", resizeListener);
    };
  }, []);

  return (
    <div className={s("container", { skew })} style={{ height }}>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};
