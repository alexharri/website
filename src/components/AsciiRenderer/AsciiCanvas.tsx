import React, { useRef, useCallback, useEffect } from "react";
import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { AsciiRenderConfig } from "./renderConfig";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { cssVariables } from "../../utils/cssVariables";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";

interface Props {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  transparent?: boolean;
}

export function AsciiCanvas(props: Props) {
  return (
    <canvas
      ref={props.canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// Character glyph cache: stores pre-rendered characters as small canvases
interface CachedGlyph {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

// Track previously rendered state for optimization
interface RenderState {
  chars: string[][];
  rows: number;
  cols: number;
}

export function useAsciiCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  config: AsciiRenderConfig | null,
  color: string,
) {
  const glyphCacheRef = useRef<Map<string, CachedGlyph>>(new Map());
  const previousRenderStateRef = useRef<RenderState | null>(null);

  const getOrCreateGlyph = useCallback(
    (
      char: string,
      fontSize: number,
      boxWidth: number,
      boxHeight: number,
      color: string,
      dpr: number,
    ): CachedGlyph => {
      const cacheKey = `${char}_${fontSize}_${boxWidth}_${boxHeight}_${color}_${dpr}`;

      let cached = glyphCacheRef.current.get(cacheKey);
      if (cached) return cached;

      // Create a small canvas for this character
      const glyphCanvas = document.createElement("canvas");

      // Measure the actual character to get precise dimensions
      const measureCanvas = document.createElement("canvas");
      const measureCtx = measureCanvas.getContext("2d");
      if (!measureCtx) {
        const emptyGlyph = { canvas: glyphCanvas, width: fontSize, height: fontSize };
        return emptyGlyph;
      }

      measureCtx.font = `${fontSize}px ${cssVariables.fontMonospace}`;

      const width = boxWidth;
      const height = boxHeight;

      glyphCanvas.width = width * dpr;
      glyphCanvas.height = height * dpr;

      const ctx = glyphCanvas.getContext("2d");
      if (!ctx) {
        const emptyGlyph = { canvas: glyphCanvas, width, height };
        return emptyGlyph;
      }

      ctx.scale(dpr, dpr);
      ctx.font = `${fontSize}px ${cssVariables.fontMonospace}`;
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(char, 0, 0);

      const glyph = { canvas: glyphCanvas, width, height };
      glyphCacheRef.current.set(cacheKey, glyph);
      return glyph;
    },
    [],
  );

  const render = useCallback(
    (samplingData: CharacterSamplingData[][], characterMatcher: CharacterMatcher) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;

      const ctx = canvas.getContext("2d", { desynchronized: true });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;
      const dpr = window.devicePixelRatio;

      // Check if dimensions changed
      const dimensionsChanged =
        !previousRenderStateRef.current ||
        previousRenderStateRef.current.rows !== config.rows ||
        previousRenderStateRef.current.cols !== config.cols;

      // If dimensions changed, resize canvas and do full render
      if (dimensionsChanged) {
        canvas.width = config.canvasWidth * dpr;
        canvas.height = config.canvasHeight * dpr;
        canvas.style.width = config.canvasWidth + "px";
        canvas.style.height = config.canvasHeight + "px";

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);

        // Initialize new state
        previousRenderStateRef.current = {
          chars: Array.from({ length: config.rows }, () => Array(config.cols).fill("")),
          rows: config.rows,
          cols: config.cols,
        };
      }

      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const cellSamplingData = samplingData[row]?.[col];
          if (!cellSamplingData) continue;

          const selectedChar = characterMatcher.findBestCharacterQuantized(
            cellSamplingData.samplingVector,
          );

          // Only render if character changed or full render needed
          const prevChar = previousRenderStateRef.current!.chars[row]?.[col];
          if (dimensionsChanged || selectedChar !== prevChar) {
            const x = col * config.boxWidth;
            const y = row * config.boxHeight;

            // Clear the cell before drawing
            if (!dimensionsChanged) {
              ctx.clearRect(x, y, config.boxWidth, config.boxHeight);
            }

            // Get or create cached glyph and draw it at the correct logical size
            const glyph = getOrCreateGlyph(
              selectedChar,
              config.fontSize,
              config.boxWidth,
              config.boxHeight,
              color,
              dpr,
            );
            ctx.drawImage(glyph.canvas, x, y, glyph.width, glyph.height);

            // Update state
            previousRenderStateRef.current!.chars[row][col] = selectedChar;
          }
        }
      }
    },
    [canvasRef, config, color, getOrCreateGlyph],
  );

  useIsomorphicLayoutEffect(() => {
    previousRenderStateRef.current = null;
  }, [config]);

  // Reset render state when dimensions change
  useEffect(() => {
    if (!config) return;
    previousRenderStateRef.current = null;
  }, [config?.rows, config?.cols]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      glyphCacheRef.current.clear();
      previousRenderStateRef.current = null;
    };
  }, []);

  return { render };
}
