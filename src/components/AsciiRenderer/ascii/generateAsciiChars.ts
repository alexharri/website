import { CharacterMatcher } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";

import { AsciiRenderConfig } from "../renderConfig";
import { clamp } from "../../../math/math";
import { SamplingEffect } from "../types";

const CONTRAST_EXPONENT_GLOBAL = 3;
const CONTRAST_EXPONENT_LOCAL = 7;

const lightnessEasingFunctions = {
  default: Bezier(0.38, 0.01, 0.67, 1),
  soft: Bezier(0.22, 0.02, 0.76, 0.82),
  increase_contrast: Bezier(1, 0, 0, 1),
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

// function readPixelFromBuffer(
//   pixelBuffer: Uint8Array,
//   canvasWidth: number,
//   canvasHeight: number,
//   tx: number,
//   ty: number,
//   pixelBufferScale: number,
//   flipY: boolean,
// ) {
//   const pixelX = Math.floor(tx * canvasWidth * pixelBufferScale);
//   const pixelY = Math.floor((flipY ? ty : 1 - ty) * canvasHeight * pixelBufferScale);

//   const clampedX = clamp(pixelX, 0, canvasWidth * pixelBufferScale - 1);
//   const clampedY = clamp(pixelY, 0, canvasHeight * pixelBufferScale - 1);

//   const index = (clampedY * (canvasWidth * pixelBufferScale) + clampedX) * 4;
//   return (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2];
// }
function readPixelFromBuffer(pixelBuffer: Uint8Array, index: number) {
  // const clampedX = clamp(pixelX, 0, canvasWidth * pixelBufferScale - 1);
  // const clampedY = clamp(pixelY, 0, canvasHeight * pixelBufferScale - 1);

  return (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2];
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
  flipY: boolean,
  effect: (value: number) => number,
  subsamples: number[] | undefined,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  const canvasWidth = config.canvasWidth * scale;
  const canvasHeight = config.canvasHeight * scale;

  samplingPoints.forEach((point, i) => {
    const sampleX = x + point.x;
    const sampleY = y + point.y;

    const pixelX = Math.floor(sampleX * scale);
    const pixelY = canvasHeight - Math.floor(sampleY * scale);
    const index = (pixelY * canvasWidth + pixelX) * 4;

    const hexColor = readPixelFromBuffer(pixelBuffer, index);
    const lightnessValue = effect(lightness(hexColor));

    totalLightness += lightnessValue;
    sampleCount++;

    if (subsamples) {
      subsamples[i] = lightnessValue;
    }
  });

  return totalLightness / sampleCount;
}

function crunchSamplingVector(vector: number[], exponent: number): void {
  const maxValue = Math.max(...vector);

  // If all values are zero, return as-is
  if (maxValue === 0) return;

  for (let i = 0; i < vector.length; i++) {
    // Normalize to 0-1 range
    const normalized = vector[i] / maxValue;
    // Apply power-law enhancement
    const enhanced = Math.pow(normalized, exponent);
    // Rescale back to original range
    vector[i] = enhanced * maxValue;
  }
}

function crunchSamplingVectorDirectional(
  vector: number[],
  contextValues: number[],
  exponent: number,
): void {
  if (vector.length !== contextValues.length) {
    throw new Error("Vector and context values must have the same length");
  }

  // const maxExternalValue = Math.max(...contextValues);
  for (let i = 0; i < vector.length; i++) {
    const value = vector[i];
    const contextValue = contextValues[i];
    if (contextValue <= value) continue;

    const normalized = value / contextValue;
    const enhanced = Math.pow(normalized, exponent);
    vector[i] = enhanced * contextValue;
  }
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
  out: CharacterSamplingData[][],
  pixelBuffer: Uint8Array,
  pixelBufferScale: number,
  config: AsciiRenderConfig,
  collectSubsamples: boolean,
  flipY: boolean,
  lightnessEasingFunction?: string,
  samplingEffects: SamplingEffect[] = [],
): void {
  const metadata = getAlphabetMetadata(config.alphabet);
  const samplingConfig = metadata.samplingConfig;

  const enabledEffects = new Set(samplingEffects);

  const easingLookupTable =
    lightnessEasingFunction && lightnessEasingFunction in easingLookupTables
      ? easingLookupTables[lightnessEasingFunction]
      : null;

  const samplingPoints = config.generateCircleSamplingPoints();

  const effect = easingLookupTable
    ? (value: number) => applyEasingLookup(value, easingLookupTable)
    : (v: number) => v;

  for (let row = out.length; row < config.rows; row++) {
    out[row] ??= [];
  }

  const externalPoints = "externalPoints" in samplingConfig ? samplingConfig.externalPoints : null;

  const samplingCircleOffsets = samplingConfig.points.map((point) =>
    config.samplingCircleOffset(point),
  );
  const externalSamplingCircleOffsets = externalPoints?.map((point) =>
    config.samplingCircleOffset(point),
  );

  const xBase = config.offsetX + config.sampleRectXOff;
  const yBase = config.offsetY + config.sampleRectYOff;
  let x = xBase;
  let y = yBase;

  for (let row = 0; row < config.rows; row++) {
    for (let col = out[row].length; col < config.cols; col++) {
      const numSamples = metadata.samplingConfig.points.length;
      const numSubsamples = numSamples * config.samplingQuality;
      out[row][col] = {
        samplingVector: Array.from({ length: numSamples }),
        externalSamplingVector: Array.from({ length: numSamples }),
        rawSamplingVector: Array.from({ length: numSamples }),
        samplingVectorSubsamples: Array.from({ length: numSubsamples }),
      };
    }

    for (let col = 0; col < config.cols; col++) {
      const {
        rawSamplingVector,
        samplingVector,
        externalSamplingVector,
        samplingVectorSubsamples,
      } = out[row][col];
      for (let i = 0; i < metadata.samplingConfig.points.length; i++) {
        const [circleXOff, circleYOff] = samplingCircleOffsets[i];
        rawSamplingVector[i] = sampleCircularRegion(
          pixelBuffer,
          config,
          x + circleXOff,
          y + circleYOff,
          samplingPoints,
          pixelBufferScale,
          flipY,
          effect,
          collectSubsamples ? samplingVectorSubsamples[i] : undefined,
        );
      }
      for (let i = 0; i < rawSamplingVector.length; i++) {
        samplingVector[i] = rawSamplingVector[i];
      }

      if (externalPoints) {
        for (let i = 0; i < metadata.samplingConfig.points.length; i++) {
          const [circleXOff, circleYOff] = externalSamplingCircleOffsets![i];
          externalSamplingVector[i] = sampleCircularRegion(
            pixelBuffer,
            config,
            x + circleXOff,
            y + circleYOff,
            samplingPoints,
            pixelBufferScale,
            flipY,
            effect,
            undefined,
          );
        }
        if (enabledEffects.has(SamplingEffect.Crunch)) {
          crunchSamplingVectorDirectional(
            samplingVector,
            externalSamplingVector,
            CONTRAST_EXPONENT_LOCAL,
          );
        }
      }
      if (enabledEffects.has(SamplingEffect.Crunch)) {
        crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);
      }
      x += config.boxWidth;
    }

    y += config.boxHeight;
    x = xBase;
  }
}

export function samplingDataToAscii(
  matcher: CharacterMatcher,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
): string {
  const chars: string[] = [];

  // let totalCount = 0;
  // let matchCount = 0;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const cellSamplingData = samplingData[row]?.[col];
      if (!cellSamplingData) {
        chars.push(" ");
        continue;
      }

      const selectedChar = matcher.findBestCharacterQuantized(cellSamplingData.samplingVector);
      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);

      // totalCount++;
      // if (selectedChar === matcher.findBestCharacterQuantized(cellSamplingData.samplingVector)) {
      //   matchCount++;
      // }
    }
    chars.push("\n");
  }

  // console.log(((matchCount / totalCount) * 100).toFixed(0) + "% match rate");

  return chars.join("");
}

export function samplingDataToAsciiBrute(
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

      const selectedChar = matcher.findBestCharacterBruteForce(cellSamplingData.samplingVector);
      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);
    }
    chars.push("\n");
  }

  return chars.join("");
}
