import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { WebGLRenderer } from "./WebGLRenderer";
import { ColorConfiguration, colorConfigurations } from "./colorConfigurations";
import { vertexShaderRegistry } from "./shaders/vertexShaders";
import { fragmentShaderRegistry } from "./shaders/fragmentShaders";
import { cssVariables } from "../../utils/cssVariables";
import { FragmentShader, FragmentShaderUniform } from "./shaders/types";
import { NumberVariable } from "../../threejs/NumberVariable";
import { clamp, invLerp, lerp } from "../../math/lerp";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { useRandomId } from "../../utils/hooks/useRandomId";
import { DEFAULT_HEIGHT, SKEW_DEG } from "./utils";

const UNIFORM_MARGIN = 24;
const SHOW_SEED_AND_TIME = false;

function calculateWebGLCanvasDimensions(props: WebGLShaderProps, viewportWidth: number) {
  let { height = DEFAULT_HEIGHT } = props;

  const width = clamp(
    viewportWidth,
    props.minWidth ?? props.width ?? viewportWidth,
    props.width ?? viewportWidth,
  );
  if (props.maintainHeight != null) {
    const fac = (Math.max(1, width / viewportWidth) - 1) * props.maintainHeight;
    height *= 1 + fac;
  }
  height = Math.round(height); // A fractional canvas height causes visual artifacts

  return [width, height];
}

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
  canvasWrapper: styled.css`
    position: relative;

    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }

    &--skew {
      transform: skewY(-${SKEW_DEG}deg);
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
  `,
});

interface FragmentShaderProps {
  fragmentShader: string;
  fragmentShaderOptions?: Partial<Record<string, unknown>>;
}

export interface WebGLShaderProps extends FragmentShaderProps {
  skew?: boolean;
  colorConfiguration: ColorConfiguration;
  width?: number;
  minWidth?: number;
  maintainHeight?: number;
  height?: number;
  showControls?: boolean;
  animate?: boolean;
  seed?: number;
  usesVariables?: boolean;
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

export const WebGLShader: React.FC<WebGLShaderProps> = (props) => {
  const s = useStyles(styles);

  const shaderTimeId = useRandomId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { showControls = true, animate = true, colorConfiguration } = props;

  const viewportWidth = useViewportWidth()!;
  const [width, height] = calculateWebGLCanvasDimensions(props, viewportWidth);

  const idealScale = Math.min(1, viewportWidth / width);
  const canvasScale = Math.ceil(height * idealScale) / height;

  const fragmentShader = useFragmentShader(props);

  const [uniformValues, setUniformValues] = useState(() => {
    const values: Record<string, number> = {};
    for (const [key, uniform] of Object.entries(fragmentShader.uniforms)) {
      values[key] = uniform.value;
    }
    return values;
  });

  const pendingUniformWrites = useRef<[string, number][]>([]);
  const colorConfigurationRef = useRef(colorConfiguration);
  colorConfigurationRef.current = colorConfiguration;

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    const colorConfig = colorConfigurations[colorConfiguration];

    const vertexShader = vertexShaderRegistry.default!;

    const createFragmentShader = fragmentShaderRegistry[props.fragmentShader];
    if (!createFragmentShader)
      throw new Error(`Could not find '${props.fragmentShader}' fragment shader.`);

    const renderer = new WebGLRenderer(
      canvas,
      vertexShader,
      fragmentShader.shader,
      colorConfig,
      props.seed,
    );
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

    let lastColorConfiguration = colorConfiguration;

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      if (resized) {
        const [width, height] = calculateWebGLCanvasDimensions(props, window.innerWidth);
        renderer.setDimensions(width, height);
        resized = false;
      }

      if (lastColorConfiguration !== colorConfigurationRef.current) {
        lastColorConfiguration = colorConfigurationRef.current;
        renderer.setColorConfig(colorConfigurations[lastColorConfiguration]);
      }

      for (let [key, value] of pendingUniformWrites.current) {
        renderer.setUniform(key, parseUniformValue(fragmentShader.uniforms[key], value));
      }
      pendingUniformWrites.current.length = 0;

      renderer.render();

      if (SHOW_SEED_AND_TIME) {
        const timeEl = document.querySelector(`[data-shader-time="${shaderTimeId}"]`);
        if (timeEl && "innerText" in timeEl) {
          timeEl.innerText = renderer.getSeed().toFixed(0) + ", " + renderer.getTime().toFixed(0);
        }
      }
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

  useEffect(() => {
    const shouldHaveUsesVariablesProp = uniformEntries.length > 0 && showControls;
    const usesVariables = props.usesVariables ?? false;
    if (shouldHaveUsesVariablesProp !== usesVariables) {
      console.warn(
        `'usesVariables' should be ${shouldHaveUsesVariablesProp} for fragment shader '${props.fragmentShader}'`,
      );
    }
  }, [fragmentShader, showControls]);

  return (
    <>
      <div className={s("canvasWrapper", { skew: props.skew })} style={{ width, maxWidth: "100%" }}>
        <div style={{ paddingTop: `${(height / width) * 100}%` }} />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            transform: `scale(${canvasScale})`,
            transformOrigin: "0 0",
          }}
        />
        {SHOW_SEED_AND_TIME && (
          <div
            style={{ position: "absolute", bottom: 16, right: 16, color: "white" }}
            data-shader-time={shaderTimeId}
          />
        )}
      </div>
      {showControls && uniformEntries.length > 0 && (
        <div className={s("variables")}>
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
