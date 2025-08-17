import React, { useEffect, useMemo, useRef, useState } from "react";
import { NumberVariable, NumberVariableSpec } from "../../threejs/NumberVariable";
import { NormalVariableSpec } from "../../threejs/NormalVariable";
import { StyleOptions, useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";

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

type VariablesOptions = {
  [key: string]: NumberVariableSpec | NormalVariableSpec;
};

type Variables<V extends VariablesOptions> = {
  [K in keyof V]: V[K]["value"] extends [number, number, number]
    ? [number, number, number]
    : V[K]["value"];
};

interface Scene2DDrawProps<V extends VariablesOptions> {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  elapsed: number;
  timeDelta: number;
  variables: Variables<V>;
}

type DrawFunction<V extends VariablesOptions> = (props: Scene2DDrawProps<V>) => void;

interface Options<V extends VariablesOptions> {
  variables?: V;
}

export interface Scene2DProps {
  height?: number;
}

const EMPTY_OBJ = {};

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

export function createScene2D<V extends VariablesOptions>(
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

    const variablesSpec = options.variables ?? (EMPTY_OBJ as V);
    const variableKeys = useMemo(() => Object.keys(variablesSpec), [variablesSpec]);

    const [variables, setVariables] = useState(() =>
      variableKeys.reduce((obj, _key) => {
        const key = _key as keyof V;
        obj[key] = variablesSpec[key].value as Variables<V>[typeof key];
        return obj;
      }, {} as Variables<V>),
    );

    const setVariableValue = (key: string, value: unknown) => {
      setVariables((obj) => ({ ...obj, [key]: value }));
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Wait for container to have dimensions
      const containerWidth = container.clientWidth || 800; // fallback width

      // Set canvas size
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
          variables,
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
    }, [height, canvasRef, onFrame, variables]);

    return (
      <>
        <div ref={containerRef} style={{ width: "100%", height: `${height}px` }}>
          <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>

        {variableKeys.length > 0 && (
          <div className={s("variablesWrapper")}>
            {variableKeys.map((key) => {
              const spec = variablesSpec[key];
              const value = variables[key];
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
              if (spec.type === "normal") {
                // For 2D scenes, we'll treat normal variables as [x, y, z] arrays
                // This allows 2D scenes to use 3D vectors if needed
                return <div key={key}>Normal variable support coming soon for 2D scenes</div>;
              }
              return null;
            })}
          </div>
        )}
      </>
    );
  };
}
