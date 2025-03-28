import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { css } from "@emotion/css";
import { StyleOptions, useStyles } from "../../utils/styles";
import { WebGLRenderer } from "./WebGLRenderer";
import { colorConfigurations } from "./colorConfigurations";
import { vertexShaderRegistry } from "./shaders/vertexShaders";
import { fragmentShaderRegistry } from "./shaders/fragmentShaders";
import { cssVariables } from "../../utils/cssVariables";
import { useVisible } from "../../utils/hooks/useVisible";
import { FragmentShader, FragmentShaderUniform } from "./shaders/types";
import { NumberVariable } from "../../threejs/NumberVariable";
import { clamp, invLerp, lerp } from "../../math/lerp";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { useRandomId } from "../../utils/hooks/useRandomId";

const DEFAULT_HEIGHT = 250;
const UNIFORM_MARGIN = 24;
const UNIFORM_V_GAP = 32;
const CONTROLS_HEIGHT = 72;
const SHOW_SEED_AND_TIME = true;

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
    }
  `,

  canvasWrapper: styled.css`
    position: relative;

    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }

    &--skew {
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
  minWidth?: number;
  maintainHeight?: number;
  height?: number;
  showControls?: boolean;
  animate?: boolean;
  seed?: number;
}

function useCanvasHeightPlaceholderClassName(props: Props) {
  const { height = DEFAULT_HEIGHT, maintainHeight = 0 } = props;
  const width = props.minWidth ?? props.width;

  return useMemo(() => {
    const styled = { css };
    const classNames = [
      styled.css`
        padding-top: ${height}px;
        width: 100vw;
      `,
    ];
    if (typeof width === "number") {
      const heightProportion = height / width;
      classNames.push(styled.css`
        @media (max-width: ${width}px) {
          padding-top: ${heightProportion * 100}vw;
          padding-bottom: calc(
            ${height * maintainHeight}px - ${heightProportion * maintainHeight * 100}vw
          );
        }
      `);
    }
    return classNames.join(" ");
  }, [width, height]);
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

function calculateCanvasDimensions(props: Props, viewportWidth: number) {
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

const _WebGLShader: React.FC<Props> = (props) => {
  const s = useStyles(styles);

  const shaderTimeId = useRandomId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { showControls = true, animate = true } = props;

  const viewportWidth = useViewportWidth()!;
  const [width, height] = calculateCanvasDimensions(props, viewportWidth);

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

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      if (resized) {
        const [width, height] = calculateCanvasDimensions(props, window.innerWidth);
        renderer.setDimensions(width, height);
        // console.log(width, { width: props.width, minWidth: props.minWidth });
        resized = false;
      }

      for (let [key, value] of pendingUniformWrites.current) {
        const uniform = fragmentShader.uniforms[key];
        value = parseUniformValue(uniform, value);
        const timeKeyMatch = /^time(?<num>[1-9]?)$/.exec(key);
        if (timeKeyMatch) {
          const numString = timeKeyMatch.groups?.num;
          const index = numString ? Number(numString) - 1 : 0;
          // The special key "time" controls the renderer time speed
          renderer.setTimeSpeed(value, index);
        } else {
          renderer.setUniform(key, value);
        }
      }
      pendingUniformWrites.current.length = 0;

      renderer.render();

      if (SHOW_SEED_AND_TIME) {
        const timeEl = document.querySelector(
          `[data-shader-time="${shaderTimeId}"]`,
        ) as HTMLSpanElement | null;
        if (timeEl) {
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
  let { skew, showControls = true } = props;
  const s = useStyles(styles);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref, "64px");

  const fragmentShader = useFragmentShader(props);
  const numUniforms = Object.keys(fragmentShader.uniforms).length;

  const heightClassName = useCanvasHeightPlaceholderClassName(props);

  return (
    <div className={[s("container", { skew }), "canvas"].join(" ")} ref={ref}>
      {visible ? (
        <_WebGLShader {...props} />
      ) : (
        <>
          <div className={heightClassName} />
          {showControls && numUniforms > 0 && (
            <div style={{ paddingBottom: `${CONTROLS_HEIGHT}px` }} />
          )}
        </>
      )}
    </div>
  );
};
