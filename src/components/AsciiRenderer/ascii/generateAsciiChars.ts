import { CharacterMatcher } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";

import { AsciiRenderConfig } from "../renderConfig";
import { SamplingEffect } from "../types";
import { clamp } from "../../../math/math";

const lightnessEasingFunctions = {
  default: Bezier(0.38, 0.01, 0.67, 1),
  soft: Bezier(0.22, 0.02, 0.76, 0.82),
  darken: Bezier(0.38, 0.01, 0.78, 0.82),
  increase_contrast: Bezier(1, 0, 0, 1),
};

const easingLookupTables: Record<string, Float32Array> = {};
const LOOKUP_TABLE_SIZE = 512;

for (const [name, easingFn] of Object.entries(lightnessEasingFunctions)) {
  const lut = new Float32Array(LOOKUP_TABLE_SIZE + 1);
  for (let i = 0; i <= LOOKUP_TABLE_SIZE; i++) {
    const t = i / LOOKUP_TABLE_SIZE;
    if (name === "increase_contrast") {
      // Hacky special case: always 0% or 100% lightness
      lut[i] = Math.round(t);
    } else {
      lut[i] = easingFn(t);
    }
  }
  easingLookupTables[name] = lut;
}

function applyEasingLookup(t: number, lookupTable: Float32Array): number {
  const scaledValue = t * LOOKUP_TABLE_SIZE;
  const index = Math.floor(scaledValue);
  return lookupTable[index];
}

function readPixelFromBuffer(pixelBuffer: Uint8Array | Uint8ClampedArray, index: number) {
  return (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2];
}

function lightness(hexColor: number): number {
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >> 8) & 0xff;
  const b = hexColor & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleCircularRegion(
  pixelBuffer: Uint8Array | Uint8ClampedArray,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
  samplingPoints: { x: number; y: number }[],
  flipY: boolean,
  effect: (value: number) => number,
  subsamples: number[] | undefined,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  samplingPoints.forEach((point, i) => {
    const sampleX = x + point.x;
    const sampleY = y + point.y;

    let pixelX = Math.floor(sampleX * scale);
    let pixelY = Math.floor(flipY ? sampleY * scale : canvasHeight - sampleY * scale);

    pixelX = clamp(pixelX, 0, canvasWidth - 1);
    pixelY = clamp(pixelY, 0, canvasHeight - 1);

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
  externalSamplingVector: number[],
  affectsMapping: number[][],
  exponent: number,
): void {
  for (let i = 0; i < vector.length; i++) {
    const value = vector[i];

    const affectingExternalIndices = affectsMapping[i];
    let contextValue = 0;
    for (const externalIndex of affectingExternalIndices) {
      contextValue = Math.max(contextValue, externalSamplingVector[externalIndex]);
    }

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
  pixelBuffer: Uint8Array | Uint8ClampedArray,
  pixelBufferScale: number,
  config: AsciiRenderConfig,
  collectSubsamples: boolean,
  flipY: boolean,
  globalCrunchExponent: number,
  directionalCrunchExponent: number,
  lightnessEasingFunction?: string,
  samplingEffects: SamplingEffect[] = [],
): void {
  const metadata = getAlphabetMetadata(config.alphabet);
  const samplingConfig = metadata.samplingConfig;

  const enabledEffects = new Set(samplingEffects);
  if (enabledEffects.has(SamplingEffect.Crunch)) {
    enabledEffects.add(SamplingEffect.GlobalCrunch);
    enabledEffects.add(SamplingEffect.DirectionalCrunch);
  }

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
  const affectsMapping = "affectsMapping" in samplingConfig ? samplingConfig.affectsMapping : [];

  const numPoints = metadata.samplingConfig.points.length;
  const numExternalPoints = externalPoints?.length ?? 0;

  const samplingCircleOffsets = samplingConfig.points.map((point) =>
    config.samplingCircleOffset(point),
  );
  const externalSamplingCircleOffsets =
    externalPoints?.map((point) => config.samplingCircleOffset(point)) ?? [];

  const xBase = config.offsetX + config.sampleRectXOff;
  const yBase = config.offsetY + config.sampleRectYOff;
  let x = xBase;
  let y = yBase;

  const canvasWidth = Math.round(config.canvasWidth * pixelBufferScale);
  const canvasHeight = Math.round(config.canvasHeight * pixelBufferScale);

  for (let row = 0; row < config.rows; row++) {
    for (let col = out[row].length; col < config.cols; col++) {
      out[row][col] = {
        samplingVector: Array.from({ length: numPoints }),
        externalSamplingVector: Array.from({ length: numExternalPoints }),
        rawSamplingVector: Array.from({ length: numPoints }),
        samplingVectorSubsamples: Array.from({ length: numPoints }, () =>
          Array.from({ length: config.samplingQuality }),
        ),
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
          x + circleXOff,
          y + circleYOff,
          canvasWidth,
          canvasHeight,
          pixelBufferScale,
          samplingPoints,
          flipY,
          effect,
          collectSubsamples ? samplingVectorSubsamples[i] : undefined,
        );
      }
      for (let i = 0; i < rawSamplingVector.length; i++) {
        samplingVector[i] = rawSamplingVector[i];
      }

      if (externalPoints) {
        for (let i = 0; i < externalPoints.length; i++) {
          const [circleXOff, circleYOff] = externalSamplingCircleOffsets[i];
          externalSamplingVector[i] = sampleCircularRegion(
            pixelBuffer,
            x + circleXOff,
            y + circleYOff,
            canvasWidth,
            canvasHeight,
            pixelBufferScale,
            samplingPoints,
            flipY,
            effect,
            undefined,
          );
        }
        if (enabledEffects.has(SamplingEffect.DirectionalCrunch)) {
          crunchSamplingVectorDirectional(
            samplingVector,
            externalSamplingVector,
            affectsMapping,
            directionalCrunchExponent,
          );
        }
      }
      if (enabledEffects.has(SamplingEffect.GlobalCrunch)) {
        crunchSamplingVector(samplingVector, globalCrunchExponent);
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

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const cellSamplingData = samplingData[row]?.[col];
      if (!cellSamplingData) {
        chars.push(" ");
        continue;
      }

      const selectedChar = matcher.findBestCharacter(cellSamplingData.samplingVector);
      chars.push(selectedChar);
    }
    chars.push("\n");
  }

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
