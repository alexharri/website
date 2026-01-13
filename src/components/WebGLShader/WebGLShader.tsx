import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import { WebGLRenderer } from "./WebGLRenderer";
import { ColorConfiguration, colorConfigurations } from "./colorConfigurations";
import { vertexShaderRegistry } from "./shaders/vertexShaders";
import { fragmentShaderRegistry } from "./shaders/fragmentShaders";
import { cssVariables } from "../../utils/cssVariables";
import { FragmentShader } from "./shaders/types";
import { NumberVariable } from "../NumberVariable";
import { clamp } from "../../math/lerp";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { useRandomId } from "../../utils/hooks/useRandomId";
import { CONTROLS_HEIGHT, DEFAULT_HEIGHT, SKEW_DEG } from "./constants";
import { useSceneContext } from "../../contexts/SceneContextProvider";
import { VariableDict } from "../../types/variables";

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

const styles = ({ styled }: StyleOptions) => ({
  canvasWrapper: styled.css`
    position: relative;
    max-width: 100%;

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
    align-items: flex-start;
    padding-left: ${cssVariables.contentPadding}px;
    padding-right: ${cssVariables.contentPadding}px;
    padding-top: 20px;
    height: ${CONTROLS_HEIGHT}px;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: ${cssVariables.mobileWidth}px) {
      padding-top: 40px;
    }
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
  const context = useSceneContext();

  const shaderTimeId = useRandomId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { showControls = true, animate = true, colorConfiguration, skew } = props;

  const viewportWidth = useViewportWidth()!;
  const [width, height] = calculateWebGLCanvasDimensions({ ...context, ...props }, viewportWidth);

  const idealScale = Math.min(1, viewportWidth / width);
  const canvasScale = Math.ceil(height * idealScale) / height;

  const fragmentShader = useFragmentShader(props);

  useEffect(() => {
    if (context?.registerVariables && Object.keys(fragmentShader.uniforms).length > 0) {
      const variableDict: VariableDict = {};
      for (const [key, uniform] of Object.entries(fragmentShader.uniforms)) {
        const { label, value, range, step, format } = uniform;
        variableDict[key] = { type: "number", label, value, range, step, format };
      }
      context.registerVariables(variableDict);
    }
  }, [context?.registerVariables, fragmentShader.uniforms]);

  const [_uniformValues, setUniformValues] = useState(() => {
    const values: Record<string, number> = {};
    for (const [key, uniform] of Object.entries(fragmentShader.uniforms)) {
      values[key] = uniform.value;
    }
    return values;
  });
  const uniformValues =
    (context?.variables as Record<string, number> | undefined) ?? _uniformValues;

  const pendingUniformWrites = useRef<[string, number][]>([]);
  const colorConfigurationRef = useRef(colorConfiguration);
  colorConfigurationRef.current = colorConfiguration;
  const contextRef = useRef(context);
  contextRef.current = context;

  const isPaused = context?.isPaused ?? false;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!colorConfigurations[colorConfiguration]) {
      console.warn(colorConfiguration);
    }
    const renderer = new WebGLRenderer(
      canvas,
      vertexShaderRegistry.default!,
      fragmentShader.shader,
      colorConfigurations[colorConfiguration],
      props.seed,
    );
    for (const [key, value] of Object.entries(uniformValues)) {
      pendingUniformWrites.current.push([key, value]);
    }
    if (!animate) renderer.setTimeSpeed(0, 0);

    let lastColorConfiguration = colorConfiguration;
    let resized = true;
    let stop = false;
    let hasRenderedOnce = false;
    let lastIsPaused = isPausedRef.current;

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      if (isPausedRef.current !== lastIsPaused) {
        renderer.setPaused(isPausedRef.current);
        lastIsPaused = isPausedRef.current;
      }

      const hasChanges =
        resized ||
        lastColorConfiguration !== colorConfigurationRef.current ||
        pendingUniformWrites.current.length > 0 ||
        !hasRenderedOnce;

      if (!hasChanges && isPausedRef.current) return;

      if (resized) {
        const [width, height] = calculateWebGLCanvasDimensions(
          { ...context, ...props },
          window.innerWidth,
        );
        renderer.setDimensions(width, height);
        resized = false;
      }

      if (lastColorConfiguration !== colorConfigurationRef.current) {
        lastColorConfiguration = colorConfigurationRef.current;
        renderer.setColorConfig(colorConfigurations[lastColorConfiguration]);
      }

      for (let [key, value] of pendingUniformWrites.current) {
        renderer.setUniform(key, value);
      }
      pendingUniformWrites.current.length = 0;

      renderer.render();
      hasRenderedOnce = true;

      if (canvas) {
        contextRef.current?.onFrame(canvas);
      }

      if (SHOW_SEED_AND_TIME) {
        const timeEl = document.querySelector(`[data-shader-time="${shaderTimeId}"]`);
        if (timeEl && "innerText" in timeEl) {
          timeEl.innerText = renderer.getSeed().toFixed(0) + ", " + renderer.getTime().toFixed(0);
        }
      }
    }
    tick();

    const resizeListener = () => (resized = true);
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

  const uniformEntries = useMemo(() => Object.entries(fragmentShader.uniforms), [fragmentShader]);

  useEffect(() => {
    const shouldHaveUsesVariablesProp = uniformEntries.length > 0 && showControls;
    const usesVariables = props.usesVariables ?? false;
    if (shouldHaveUsesVariablesProp !== usesVariables) {
      console.warn(
        `'usesVariables' should be ${shouldHaveUsesVariablesProp} for fragment shader '${props.fragmentShader}'`,
      );
    }
  }, [uniformEntries, showControls]);

  return (
    <>
      <div className={s("canvasWrapper", { skew })} style={{ width, height }}>
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
      {showControls && uniformEntries.length > 0 && !context?.registerVariables && (
        <div className={s("variables")}>
          {uniformEntries.map(([key, uniform]) => {
            return (
              <NumberVariable
                key={key}
                dataKey={key}
                value={uniformValues[key] ?? uniform.value}
                onValueChange={(value) => setUniformValue(key, value)}
                spec={uniform}
                width={uniformEntries.length > 1 ? "small" : "normal"}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
