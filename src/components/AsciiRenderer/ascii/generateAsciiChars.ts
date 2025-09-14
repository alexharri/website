import { CharacterMatcher } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";

import { AsciiRenderConfig } from "../renderConfig";
import { clamp } from "../../../math/math";
import { SamplingPointVisualizationMode } from "../types";

const CONTRAST_EXPONENT_GLOBAL = 3;
const CONTRAST_EXPONENT_LOCAL = 7;

const lightnessEasingFunctions = {
  default: Bezier(0.38, 0.01, 0.67, 1),
  soft: Bezier(0.22, 0.02, 0.76, 0.82),
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
) {
  tx = clamp(tx, 0, 1);
  ty = clamp(ty, 0, 1);
  const pixelX = Math.floor(tx * canvasWidth * pixelBufferScale);
  const pixelY = Math.floor((1 - ty) * canvasHeight * pixelBufferScale);
  const index = (pixelY * (canvasWidth * pixelBufferScale) + pixelX) * 4;

  if (index >= 0 && index < pixelBuffer.length - 3) {
    return (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2];
  }
  return 0x000000;
}

function lightness(hexColor: number): number {
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >> 8) & 0xff;
  const b = hexColor & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleCircularRegion(
  pixelBuffer: Uint8Array,
  config: AsciiRenderConfig,
  x: number,
  y: number,
  samplingPoints: { x: number; y: number }[],
  scale: number,
  collectSubsamples?: boolean,
): { averageLightness: number; individualValues: number[] } {
  let totalLightness = 0;
  let sampleCount = 0;
  const individualValues: number[] = [];

  // Always sample center point

  for (const point of samplingPoints) {
    const sampleX = x + point.x;
    const sampleY = y + point.y;

    const tx = sampleX / config.canvasWidth;
    const ty = sampleY / config.canvasHeight;

    let lightnessValue = 0;
    if (tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1) {
      const hexColor = readPixelFromBuffer(
        pixelBuffer,
        config.canvasWidth,
        config.canvasHeight,
        tx,
        ty,
        scale,
      );
      lightnessValue = lightness(hexColor);
      totalLightness += lightnessValue;
      sampleCount++;
    }

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

function crunchSamplingVectorDirectional(
  vector: number[],
  contextValues: number[],
  exponent: number,
): number[] {
  if (vector.length !== contextValues.length) {
    throw new Error("Vector and context values must have the same length");
  }

  // const maxExternalValue = Math.max(...contextValues);
  return vector.map((value, index) => {
    const contextValue = contextValues[index];
    if (contextValue <= value) return value;

    const normalized = value / contextValue;
    const enhanced = Math.pow(normalized, exponent);
    return enhanced * contextValue;
  });
}

export interface CharacterSamplingData {
  samplingVector: number[];
  externalSamplingVector: number[];
  samplingVectorSubsamples: number[][];
}

export interface GenerationResult {
  ascii: string;

  samplingData: CharacterSamplingData[][];
}

export function generateAsciiChars(
  matcher: CharacterMatcher,
  pixelBuffer: Uint8Array,
  pixelBufferScale: number,
  config: AsciiRenderConfig,
  visualizationMode?: SamplingPointVisualizationMode,
  lightnessEasingFunction?: string,
  collectSubsamples?: boolean,
): GenerationResult {
  const metadata = getAlphabetMetadata(config.alphabet);
  const samplingConfig = metadata.samplingConfig;

  const easingLookupTable =
    lightnessEasingFunction && lightnessEasingFunction in easingLookupTables
      ? easingLookupTables[lightnessEasingFunction]
      : null;

  const samplingPoints = config.generateCircleSamplingPoints();
  function createSamplingVector(
    col: number,
    row: number,
    samplingCircleCenterPoints: { x: number; y: number }[],
    collectSubsamples?: boolean,
  ): { samplingVector: number[]; subsamples: number[][] } {
    const [sampleRectLeft, sampleRectTop] = config.sampleRectPosition(col, row);
    const samplingVector: number[] = [];
    const subsamples: number[][] = [];

    samplingCircleCenterPoints.forEach((samplingCircleCenterPoint) => {
      const [xOff, yOff] = config.samplingCircleOffset(samplingCircleCenterPoint);
      const x = sampleRectLeft + xOff;
      const y = sampleRectTop + yOff;
      const result = sampleCircularRegion(pixelBuffer, config, x, y, samplingPoints, pixelBufferScale, collectSubsamples);
      samplingVector.push(result.averageLightness);
      subsamples.push(result.individualValues);
    });

    return { samplingVector, subsamples };
  }

  const chars: string[] = [];
  const samplingData: CharacterSamplingData[][] = [];

  for (let row = 0; row < config.rows; row++) {
    const samplingDataRow: CharacterSamplingData[] = [];
    samplingData.push(samplingDataRow);

    for (let col = 0; col < config.cols; col++) {
      const shouldCollectSubsamples = collectSubsamples;
      const rawSamplingResult = createSamplingVector(col, row, metadata.samplingConfig.points, shouldCollectSubsamples);
      const rawSamplingVector = rawSamplingResult.samplingVector;
      const samplingVectorSubsamples = rawSamplingResult.subsamples;

      let samplingVector = [...rawSamplingVector];

      // Apply lightness easing function if specified
      if (easingLookupTable) {
        samplingVector = samplingVector.map((value) => applyEasingLookup(value, easingLookupTable));
        // samplingVector = samplingVector.map((value) => clamp(value - 0.01, 0, 1));
      }

      let externalSamplingVector: number[] = [];
      if ("externalPoints" in samplingConfig) {
        const externalResult = createSamplingVector(col, row, samplingConfig.externalPoints);
        externalSamplingVector = externalResult.samplingVector;
        samplingVector = crunchSamplingVectorDirectional(
          samplingVector,
          externalSamplingVector,
          CONTRAST_EXPONENT_LOCAL,
        );
      }
      samplingVector = crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);

      let selectedChar = matcher.findBestCharacter(samplingVector);

      const vectorToStore = visualizationMode === "crunched" ? samplingVector : rawSamplingVector;
      samplingDataRow.push({
        samplingVector: vectorToStore,
        externalSamplingVector,
        samplingVectorSubsamples
      });

      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);
    }
    chars.push("\n");
  }

  const ascii = chars.join("");
  return {
    ascii,
    samplingData,
  };
}
