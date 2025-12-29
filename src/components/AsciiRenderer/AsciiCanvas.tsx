import React from "react";
import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { AsciiRenderConfig } from "./renderConfig";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { cssVariables } from "../../utils/cssVariables";

interface Props {
  onCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  transparent?: boolean;
}

export function AsciiCanvas(props: Props) {
  return (
    <canvas
      ref={props.onCanvasRef}
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

const glyphCache = new Map<string, CachedGlyph>();

function getOrCreateGlyph(
  char: string,
  fontSize: number,
  boxWidth: number,
  boxHeight: number,
  color: string,
): CachedGlyph {
  const cacheKey = `${char}_${fontSize}_${boxWidth}_${boxHeight}_${color}`;

  let cached = glyphCache.get(cacheKey);
  if (cached) return cached;

  // Create a small canvas for this character
  const glyphCanvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;

  // Measure the actual character to get precise dimensions
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d", { willReadFrequently: true });
  if (!measureCtx) {
    const emptyGlyph = { canvas: glyphCanvas, width: fontSize, height: fontSize };
    return emptyGlyph;
  }

  measureCtx.font = `${fontSize}px ${cssVariables.fontMonospace}`;

  const width = boxWidth;
  const height = boxHeight;

  glyphCanvas.width = width * dpr;
  glyphCanvas.height = height * dpr;

  const ctx = glyphCanvas.getContext("2d", { willReadFrequently: true });
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
  glyphCache.set(cacheKey, glyph);
  return glyph;
}

export function clearGlyphCache() {
  glyphCache.clear();
}

export function clearRenderState() {
  previousRenderState = null;
}

// Track previously rendered state for optimization
interface RenderState {
  chars: string[][];
  rows: number;
  cols: number;
}

let previousRenderState: RenderState | null = null;

export function renderAsciiCanvas(
  canvas: HTMLCanvasElement,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
  characterMatcher: CharacterMatcher,
  color: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  // Check if dimensions changed
  const dimensionsChanged =
    !previousRenderState ||
    previousRenderState.rows !== config.rows ||
    previousRenderState.cols !== config.cols;

  // If dimensions changed, resize canvas and do full render
  if (dimensionsChanged) {
    canvas.width = config.canvasWidth * dpr;
    canvas.height = config.canvasHeight * dpr;
    canvas.style.width = config.canvasWidth + "px";
    canvas.style.height = config.canvasHeight + "px";

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);

    // Initialize new state
    previousRenderState = {
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
      const prevChar = previousRenderState!.chars[row]?.[col];
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
        );
        ctx.drawImage(glyph.canvas, x, y, glyph.width, glyph.height);

        // Update state
        previousRenderState!.chars[row][col] = selectedChar;
      }
    }
  }
}
