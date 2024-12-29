import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { WebGLRenderer } from "./WebGLRenderer";
import { colorConfigurations } from "./colorConfigurations";
import { vertexShaderRegistry } from "./shaders/vertexShaders";
import { fragmentShaderRegistry } from "./shaders/fragmentShaders";
import { cssVariables } from "../../utils/cssVariables";
import { useVisible } from "../../utils/hooks/useVisible";
import { FragmentShader, FragmentShaderUniform } from "./shaders/types";
import { NumberVariable } from "../../threejs/NumberVariable";
import { invLerp, lerp } from "../../math/lerp";

const DEFAULT_HEIGHT = 250;
const UNIFORM_MARGIN = 24;
const UNIFORM_V_GAP = 32;

function parseUniformValue(uniform: FragmentShaderUniform, value: number) {
  if (uniform.remap) {
    const [min, max] = uniform.range;
    const [from, to] = uniform.remap;
    const t = invLerp(min, max, value);
    value = lerp(from, to, t);
  }
  return value;
}

const styles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    width: 100vw;
    margin: 40px -${cssVariables.contentPadding}px;
    display: flex;
    flex-direction: column;
    align-items: center;

    canvas {
      border-radius: 0;
    }

    &--skew {
      margin: calc(32px + min(100vw, ${cssVariables.contentWidth}px) * 0.04) -${cssVariables.contentPadding}px
        calc(48px + min(100vw, ${cssVariables.contentWidth}px) * 0.04);
      transform: skewY(-6deg);
    }
  `,

  variables: styled.css`
    position: relative;
    z-index: 2;
    display: flex;
    gap: 32px;
    align-items: center;
    padding-left: ${cssVariables.contentPadding}px;
    padding-right: ${cssVariables.contentPadding}px;
    margin-top: ${UNIFORM_MARGIN}px;
    padding-bottom: ${UNIFORM_MARGIN * 2}px;
    margin-bottom: ${-UNIFORM_MARGIN}px;
    max-width: 100%;
    overflow-x: auto;

    &--vertical {
      flex-direction: column;
      gap: ${UNIFORM_V_GAP}px;
    }
  `,
});

interface FragmentShaderProps {
  fragmentShader: string;
  fragmentShaderOptions?: Partial<Record<string, unknown>>;
}

interface Props extends FragmentShaderProps {
  skew?: boolean;
  colorConfiguration: keyof typeof colorConfigurations;
  width?: number;
  height?: number;
  showControls?: boolean;
  animate?: boolean;
}

function useFragmentShader(props: FragmentShaderProps): FragmentShader {
  const fragmentShader = useMemo((): FragmentShader => {
    const createFragmentShader = fragmentShaderRegistry[props.fragmentShader];
    if (!createFragmentShader)
      throw new Error(`Could not find '${props.fragmentShader}' fragment shader.`);

    let fragmentShader = createFragmentShader(props.fragmentShaderOptions ?? {});
    if (typeof fragmentShader === "string") {
      return { shader: fragmentShader, uniforms: {} };
    }
    return fragmentShader;
  }, [props.fragmentShader, props.fragmentShaderOptions]);
  return fragmentShader;
}

const _WebGLShader: React.FC<Props> = (props) => {
  const s = useStyles(styles);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { height = 250, width, showControls = true, animate = true } = props;

  const fragmentShader = useFragmentShader(props);

  const [uniformValues, setUniformValues] = useState(() => {
    const values: Record<string, number> = {};
    for (const [key, uniform] of Object.entries(fragmentShader.uniforms)) {
      values[key] = uniform.value;
    }
    return values;
  });

  const pendingUniformWrites = useRef<[string, number][]>([]);

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

    const renderer = new WebGLRenderer(canvas, vertexShader, fragmentShader.shader, colorConfig);
    for (const [key, value] of Object.entries(uniformValues)) {
      pendingUniformWrites.current.push([key, value]);
    }
    if (!animate) {
      renderer.setTimeSpeed(0, 0);
    }

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

      for (let [key, value] of pendingUniformWrites.current) {
        const uniform = fragmentShader.uniforms[key];
        value = parseUniformValue(uniform, value);
        const timeKeyMatch = /^time(?<index>[1-9]?)$/.exec(key);
        if (timeKeyMatch) {
          const indexString = timeKeyMatch.groups?.index;
          const index = indexString ? Number(indexString) : 0;
          // The special key "time" controls the renderer time speed
          renderer.setTimeSpeed(value, index);
        } else {
          renderer.setUniform(key, value);
        }
      }
      pendingUniformWrites.current.length = 0;

      renderer.render();
    }
    tick();

    window.addEventListener("resize", resizeListener);
    return () => {
      stop = true;
      window.removeEventListener("resize", resizeListener);
    };
  }, [fragmentShader, animate]);

  const setUniformValue = useCallback((key: string, value: number) => {
    pendingUniformWrites.current.push([key, value]);
    setUniformValues((values) => ({ ...values, [key]: value }));
  }, []);

  const uniformEntries = Object.entries(fragmentShader.uniforms);

  return (
    <>
      <canvas ref={canvasRef} width={width} height={height} />
      {showControls && (
        <div className={s("variables", { vertical: false && uniformEntries.length > 2 })}>
          {uniformEntries.map(([key, uniform]) => {
            return (
              <NumberVariable
                key={key}
                dataKey={key}
                value={uniformValues[key] ?? uniform.value}
                onValueChange={(value) => setUniformValue(key, value)}
                spec={uniform}
                width={uniform.width}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export const WebGLShader: React.FC<Props> = (props) => {
  let { height = DEFAULT_HEIGHT, skew, showControls = true } = props;
  const s = useStyles(styles);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref, "64px");

  const fragmentShader = useFragmentShader(props);
  const numUniforms = Object.keys(fragmentShader.uniforms).length;
  // if (numUniforms > 2) {
  //   height += UNIFORM_MARGIN * 2 + numUniforms * UNIFORM_HEIGHT + UNIFORM_V_GAP * (numUniforms - 1);
  // } else
  if (showControls && numUniforms > 0) {
    height += 72;
  }

  return (
    <div className={s("container", { skew })} style={{ height }} ref={ref}>
      {visible && <_WebGLShader {...props} />}
    </div>
  );
};
