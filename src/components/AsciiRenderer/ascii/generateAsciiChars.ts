import { CharacterMatcher } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";

import { AsciiRenderConfig } from "../renderConfig";
import { clamp } from "../../../math/math";

const CONTRAST_EXPONENT_GLOBAL = 3;

const lightnessEasingFunctions = {
  default: Bezier(0.38, 0.01, 0.67, 1),
  soft: Bezier(0.22, 0.02, 0.76, 0.82),
  increase_contrast: Bezier(0.55, 0.01, 0.58, 0.99),
};

const easingLookupTables: Record<string, Float32Array> = {};
const LOOKUP_TABLE_SIZE = 512;

for (const [name, easingFn] of Object.entries(lightnessEasingFunctions)) {
  const lut = new Float32Array(LOOKUP_TABLE_SIZE + 1);
  for (let i = 0; i <= LOOKUP_TABLE_SIZE; i++) {
    const t = i / LOOKUP_TABLE_SIZE;
    lut[i] = easingFn(t);
  }
  easingLookupTables[name] = lut;
}

function applyEasingLookup(t: number, lookupTable: Float32Array): number {
  const scaledValue = t * LOOKUP_TABLE_SIZE;
  const index = Math.floor(scaledValue);
  return lookupTable[index];
}

function readPixelFromBuffer(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  tx: number,
  ty: number,
  pixelBufferScale: number,
  flipY: boolean,
) {
  const pixelX = Math.floor(tx * canvasWidth * pixelBufferScale);
  const pixelY = Math.floor((flipY ? ty : 1 - ty) * canvasHeight * pixelBufferScale);

  const clampedX = clamp(pixelX, 0, canvasWidth * pixelBufferScale - 1);
  const clampedY = clamp(pixelY, 0, canvasHeight * pixelBufferScale - 1);

  const index = (clampedY * (canvasWidth * pixelBufferScale) + clampedX) * 4;
  return (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2];
}

function lightness(hexColor: number): number {
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >> 8) & 0xff;
  const b = hexColor & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleGridCell(
  pixelBuffer: Uint8Array,
  config: AsciiRenderConfig,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  samplingPoints: { x: number; y: number }[],
  scale: number,
  collectSubsamples: boolean,
  flipY: boolean,
): { averageLightness: number; individualValues: number[] } {
  let totalLightness = 0;
  let sampleCount = 0;
  const individualValues: number[] = [];

  // Sample points throughout the grid cell
  const cellCenterX = cellX + cellWidth / 2;
  const cellCenterY = cellY + cellHeight / 2;

  // Scale sampling points to fit within the cell dimensions
  const maxRadius = Math.min(cellWidth, cellHeight) / 2;

  for (const point of samplingPoints) {
    // Scale the point offset to fit within the cell
    const scaledX = (point.x / config.samplePointRadius) * maxRadius;
    const scaledY = (point.y / config.samplePointRadius) * maxRadius;

    const sampleX = cellCenterX + scaledX;
    const sampleY = cellCenterY + scaledY;

    const tx = sampleX / config.canvasWidth;
    const ty = sampleY / config.canvasHeight;

    const hexColor = readPixelFromBuffer(
      pixelBuffer,
      config.canvasWidth,
      config.canvasHeight,
      tx,
      ty,
      scale,
      flipY,
    );
    const lightnessValue = lightness(hexColor);
    totalLightness += lightnessValue;
    sampleCount++;

    if (collectSubsamples) {
      individualValues.push(lightnessValue);
    }
  }

  const averageLightness = sampleCount > 0 ? totalLightness / sampleCount : 0;
  return { averageLightness, individualValues };
}

function crunchSamplingVector(vector: number[], exponent: number): number[] {
  const maxValue = Math.max(...vector);

  // If all values are zero, return as-is
  if (maxValue === 0) return vector;

  return vector.map((value) => {
    // Normalize to 0-1 range
    const normalized = value / maxValue;
    // Apply power-law enhancement
    const enhanced = Math.pow(normalized, exponent);
    // Rescale back to original range
    return enhanced * maxValue;
  });
}


export interface CharacterSamplingData {
  samplingVector: number[];
  rawSamplingVector: number[];
  externalSamplingVector: number[];
  samplingVectorSubsamples: number[][];
}

export interface GenerationResult {
  ascii: string;

  samplingData: CharacterSamplingData[][];
}

export function generateSamplingData(
  pixelBuffer: Uint8Array,
  pixelBufferScale: number,
  config: AsciiRenderConfig,
  collectSubsamples: boolean,
  flipY: boolean,
  lightnessEasingFunction?: string,
): CharacterSamplingData[][] {
  const metadata = getAlphabetMetadata(config.alphabet);

  const easingLookupTable =
    lightnessEasingFunction && lightnessEasingFunction in easingLookupTables
      ? easingLookupTables[lightnessEasingFunction]
      : null;

  const samplingPoints = config.generateGridSamplingPoints();
  function createSamplingVector(
    col: number,
    row: number,
    gridCells: Array<{ row: number; col: number }>,
    gridRows: number,
    gridCols: number,
    collectSubsamples: boolean,
    flipY: boolean,
  ): { samplingVector: number[]; subsamples: number[][] } {
    const [sampleRectLeft, sampleRectTop] = config.sampleRectPosition(col, row);
    const samplingVector: number[] = [];
    const subsamples: number[][] = [];

    for (const cell of gridCells) {
      const [xOff, yOff, cellWidth, cellHeight] = config.samplingGridCellOffset(cell.row, cell.col, gridRows, gridCols);
      const cellX = sampleRectLeft + xOff;
      const cellY = sampleRectTop + yOff;
      const result = sampleGridCell(
        pixelBuffer,
        config,
        cellX,
        cellY,
        cellWidth,
        cellHeight,
        samplingPoints,
        pixelBufferScale,
        collectSubsamples,
        flipY,
      );
      samplingVector.push(result.averageLightness);
      subsamples.push(result.individualValues);
    }

    return { samplingVector, subsamples };
  }

  const samplingData: CharacterSamplingData[][] = [];

  for (let row = 0; row < config.rows; row++) {
    const samplingDataRow: CharacterSamplingData[] = [];
    samplingData.push(samplingDataRow);

    for (let col = 0; col < config.cols; col++) {
      const shouldCollectSubsamples = collectSubsamples;

      // Generate grid cells if not provided
      const gridCells = metadata.samplingConfig.gridCells || (() => {
        const cells = [];
        for (let row = 0; row < metadata.samplingConfig.gridRows; row++) {
          for (let col = 0; col < metadata.samplingConfig.gridCols; col++) {
            cells.push({ row, col });
          }
        }
        return cells;
      })();

      const rawSamplingResult = createSamplingVector(
        col,
        row,
        gridCells,
        metadata.samplingConfig.gridRows,
        metadata.samplingConfig.gridCols,
        shouldCollectSubsamples,
        flipY,
      );
      const rawSamplingVector = rawSamplingResult.samplingVector;
      const samplingVectorSubsamples = rawSamplingResult.subsamples;

      let samplingVector = [...rawSamplingVector];

      if (easingLookupTable) {
        samplingVector = samplingVector.map((value) => applyEasingLookup(value, easingLookupTable));
      }

      let externalSamplingVector: number[] = [];
      // Grid-based sampling doesn't use external points, so we skip this step
      samplingVector = crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);

      samplingDataRow.push({
        samplingVector,
        rawSamplingVector,
        externalSamplingVector,
        samplingVectorSubsamples,
      });
    }
  }

  return samplingData;
}

export function samplingDataToAscii(
  matcher: CharacterMatcher,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
): string {
  const chars: string[] = [];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const cellSamplingData = samplingData[row]?.[col];
      if (!cellSamplingData) {
        chars.push(" ");
        continue;
      }

      const selectedChar = matcher.findBestCharacter(cellSamplingData.samplingVector);
      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);
    }
    chars.push("\n");
  }

  return chars.join("");
}
