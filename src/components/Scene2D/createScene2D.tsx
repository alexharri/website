import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumberVariable } from "../variables";
import { StyleOptions, useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { VariableDict, VariableSpec, VariableValues } from "../../types/variables";

const styles = ({ styled }: StyleOptions) => ({
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

type LocalVariables<V extends VariableDict> = {
  [K in keyof V]: V[K]["value"] extends [number, number, number]
    ? [number, number, number]
    : V[K]["value"];
};

interface Scene2DDrawProps<V extends VariableDict> {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  elapsed: number;
  timeDelta: number;
  variables: LocalVariables<V>;
}

type DrawFunction<V extends VariableDict> = (props: Scene2DDrawProps<V>) => void;

interface Options<V extends VariableDict> {
  variables?: V;
}

export interface Scene2DProps {
  height?: number;
}

function flipBufferYAxis(buffer: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(buffer.length);
  const bytesPerPixel = 4;

  for (let y = 0; y < height; y++) {
    const sourceRow = (height - 1 - y) * width * bytesPerPixel;
    const targetRow = y * width * bytesPerPixel;
    for (let x = 0; x < width * bytesPerPixel; x++) {
      out[targetRow + x] = buffer[sourceRow + x];
    }
  }

  return out;
}

export function createScene2D<V extends VariableDict>(
  drawFunction: DrawFunction<V>,
  options: Options<V> = {},
) {
  return (props: Scene2DProps) => {
    const context = useCanvasContext();

    const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = context?.canvasRef || fallbackCanvasRef;

    const height = props.height ?? context?.height;
    if (typeof height !== "number") {
      throw new Error("No height specified for scene");
    }

    const onFrame = context?.onFrame;

    const containerRef = useRef<HTMLDivElement>(null);
    const s = useStyles(styles);

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
      if (context?.registerSceneVariables && variableKeys.length > 0) {
        context.registerSceneVariables(variablesSpec);
      }
    }, [context?.registerSceneVariables, variableKeys.length]);

    const variableValuesRef = useRef<LocalVariables<V>>(null!);
    variableValuesRef.current = (context?.variables ?? variableValues) as LocalVariables<V>;

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.clientWidth;

      canvas.width = containerWidth;
      canvas.height = height;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let mounted = true;
      const startTime = Date.now();
      let lastTime = Date.now();

      const tick = () => {
        if (!mounted) return;
        requestAnimationFrame(tick);

        const now = Date.now();
        const timeDelta = now - lastTime;
        const elapsed = now - startTime;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw scene
        drawFunction({
          ctx,
          width: canvas.width,
          height: canvas.height,
          elapsed,
          timeDelta,
          variables: variableValuesRef.current,
        });

        if (onFrame) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let buffer = new Uint8Array(imageData.data.buffer);
          buffer = flipBufferYAxis(buffer, canvas.width, canvas.height);
          onFrame(buffer);
        }

        lastTime = now;
      };
      tick();

      return () => {
        mounted = false;
      };
    }, [height, canvasRef, onFrame]);

    return (
      <>
        <div ref={containerRef} style={{ width: "100%", height: `${height}px` }}>
          <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>

        {variableKeys.length > 0 && !context?.registerSceneVariables && (
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
