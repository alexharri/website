import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumberVariable } from "../NumberVariable";
import { StyleOptions, useStyles } from "../../utils/styles";
import { useSceneContext } from "../../contexts/SceneContextProvider";
import { VariableDict, VariableSpec, VariableValues } from "../../types/variables";
import { useSceneHeight } from "../../utils/hooks/useSceneHeight";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { cssVariables } from "../../utils/cssVariables";

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    margin: 40px auto;
    outline: 2px solid ${theme.medium400};
    border-radius: 8px;
    overflow: hidden;

    &--fullWidth {
      border: none;
      margin: 40px -${cssVariables.contentPadding}px;
      border-radius: 0;
    }
  `,

  loadingMessage: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${theme.text400};
  `,

  variablesWrapper: styled.css`
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    gap: 32px;
    height: 72px;
    padding-bottom: 16px;
    align-items: center;
    margin-top: -16px;
  `,
});

type Variables<V extends VariableDict> = {
  [K in keyof V]: V[K]["value"];
};

interface DrawOptions<V extends VariableDict> {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  targetWidth: number;
  targetHeight: number;
  elapsed: number;
  timeDelta: number;
  variables: Variables<V>;
}

type DrawFunction<V extends VariableDict> = (props: DrawOptions<V>) => void;

interface Options<V extends VariableDict> {
  variables?: V;
  static?: boolean;
  isLoading?: () => boolean;
}

export interface Scene2DProps {
  height?: number;
  width?: number;
}

export function createScene2D<V extends VariableDict>(
  drawFunction: DrawFunction<V>,
  options: Options<V> = {},
) {
  return (props: Scene2DProps) => {
    const context = useSceneContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const s = useStyles(styles);
    const lastVariablesRef = useRef({} as Record<string, unknown>);
    const viewportWidth = useViewportWidth();

    const targetHeight = props.height ?? context?.height;
    const targetWidth = props.width;

    if (typeof targetHeight !== "number") {
      throw new Error("No height specified for scene");
    }

    const { height } = useSceneHeight(targetHeight);

    let width: number | "full" = targetWidth ?? "full";
    if (viewportWidth != null && typeof width === "number") {
      if (width > viewportWidth + 48) {
        width = "full";
      }
    }

    const variablesSpec = useMemo(() => options.variables ?? ({} as V), [options.variables]);
    const variableKeys = useMemo(() => Object.keys(variablesSpec), [variablesSpec]);

    const [variableValues, setVariableValues] = useState(() => {
      const initialVariables: VariableValues = {};
      for (const [key, spec] of Object.entries(variablesSpec)) {
        initialVariables[key] = spec.value;
      }
      return initialVariables;
    });

    const setVariableValue = useCallback((key: string, value: VariableSpec["value"]) => {
      setVariableValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    useEffect(() => {
      if (variableKeys.length > 0) {
        context?.registerVariables(variablesSpec);
      }
    }, [context?.registerVariables, variableKeys.length]);

    useEffect(() => {
      context?.setNeverPause(!!options.static);
    }, []);

    const variableValuesRef = useRef<Variables<V>>(null!);
    variableValuesRef.current = (context?.variables ?? variableValues) as Variables<V>;

    const heightRef = useRef(height);
    heightRef.current = height;

    const [isLoading, setIsLoading] = useState(options.isLoading?.() ?? false);
    const isLoadingRef = useRef(isLoading);
    isLoadingRef.current = isLoading;

    const isPaused = context?.isPaused ?? false;
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      let mounted = true;
      let startTime = Date.now();
      let lastTime = Date.now();
      let pauseStartTime: number | null = null;
      let hasRenderedOnce = false;

      const tick = () => {
        if (!mounted) return;
        requestAnimationFrame(tick);

        const width = container.clientWidth;
        const height = heightRef.current;
        const variables = variableValuesRef.current;

        let hasChanges = false;

        const isLoading = options.isLoading?.() ?? false;
        if (isLoadingRef.current && !isLoading) {
          setIsLoading(isLoading);
          hasChanges = true;
        }

        if (width !== canvas.width || height !== canvas.height) {
          canvas.width = width;
          canvas.height = height;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          hasChanges = true;
        }

        for (const [key, value] of Object.entries(variables)) {
          if (lastVariablesRef.current[key] !== value) {
            hasChanges = true;
            lastVariablesRef.current = { ...variables };
            break;
          }
        }

        if (!hasRenderedOnce) {
          hasChanges = true;
        }

        if (!hasChanges && (isPausedRef.current || options.static)) {
          pauseStartTime ??= Date.now();
          return;
        }

        if (pauseStartTime) {
          const delta = Date.now() - pauseStartTime;
          startTime += delta;
          pauseStartTime = null;
        }

        const now = Date.now();
        const timeDelta = now - lastTime;
        const elapsed = now - startTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFunction({
          ctx,
          width,
          height,
          targetWidth: targetWidth || width,
          targetHeight,
          elapsed,
          timeDelta,
          variables,
        });

        context?.onFrame(canvas);

        hasRenderedOnce = true;
        lastTime = now;
      };
      tick();

      return () => {
        mounted = false;
      };
    }, [canvasRef, context?.onFrame]);

    let widthStyle: string | number | undefined;
    if (context) {
      widthStyle = "100%";
    } else if (typeof width === "number") {
      widthStyle = width;
    }

    return (
      <>
        <div
          className={context ? undefined : s("container", { fullWidth: width === "full" })}
          ref={containerRef}
          style={{ width: widthStyle, height }}
        >
          <canvas ref={canvasRef} style={{ display: isLoading ? "none" : "block" }} />
          {isLoading && <p className={s("loadingMessage")}>Loading...</p>}
        </div>

        {variableKeys.length > 0 && !context?.registerVariables && (
          <div className={s("variablesWrapper")}>
            {variableKeys.map((key) => {
              const spec = variablesSpec[key];
              const value = variableValues[key];
              if (spec.type === "number")
                return (
                  <NumberVariable
                    key={key}
                    dataKey={key}
                    value={value as number}
                    onValueChange={(value) => setVariableValue(key, value)}
                    spec={spec}
                    showValue={true}
                  />
                );
              throw new Error(`2D scenes do not support variables of type '${spec.type}'.`);
            })}
          </div>
        )}
      </>
    );
  };
}
