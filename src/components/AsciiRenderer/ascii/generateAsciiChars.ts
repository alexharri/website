// Generate by Claude with A LOT of help from me

import { CharacterMatcher } from "./CharacterMatcher";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";

import { AsciiRenderConfig } from "../renderConfig";
import { SamplingEffect } from "../types";
import { clamp } from "../../../math/math";

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
    let pixelY = Math.floor(flipY ? canvasHeight - sampleY * scale : sampleY * scale);

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
  if (maxValue === 0) return;
  for (let i = 0; i < vector.length; i++) {
    const normalized = vector[i] / maxValue;
    const enhanced = Math.pow(normalized, exponent);
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
  character: string | null;
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
  increaseContrast?: boolean,
  samplingEffects: SamplingEffect[] = [],
): void {
  const metadata = getAlphabetMetadata(config.alphabet);
  const samplingConfig = metadata.samplingConfig;

  const enabledEffects = new Set(samplingEffects);
  if (enabledEffects.has(SamplingEffect.Crunch)) {
    enabledEffects.add(SamplingEffect.GlobalCrunch);
    enabledEffects.add(SamplingEffect.DirectionalCrunch);
  }

  const samplingPoints = config.generateCircleSamplingPoints();

  const effect = increaseContrast ? (value: number) => Math.round(value) : (v: number) => v;

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
        character: null,
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

      const selectedChar =
        cellSamplingData.character ||
        matcher.findBestCharacterQuantized(cellSamplingData.samplingVector);
      chars.push(selectedChar);
    }
    chars.push("\n");
  }

  return chars.join("");
}
