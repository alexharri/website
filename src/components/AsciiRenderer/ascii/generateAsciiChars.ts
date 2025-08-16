import { CharacterMatcher } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { AlphabetName, getAlphabetMetadata } from "../alphabets/AlphabetManager";
import { clamp } from "../../../math/math";

const CONTRAST_EXPONENT_GLOBAL = 3;
const CONTRAST_EXPONENT_LOCAL = 7;
const SAMPLE_QUALITY = 10; // Number of samples per circle (higher = better quality, slower)

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
  x: number,
  y: number,
) {
  const pixelX = Math.floor(x * canvasWidth);
  const pixelY = Math.floor((1 - y) * canvasHeight);
  const index = (pixelY * canvasWidth + pixelX) * 4;

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
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  radius: number,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  // Always sample center point
  const tx = x / canvasWidth;
  const ty = y / canvasHeight;
  const centerColor = readPixelFromBuffer(pixelBuffer, canvasWidth, canvasHeight, tx, ty);
  totalLightness += lightness(centerColor);
  sampleCount++;

  // Sample at edge of circle at evenly spaced angles
  for (let i = 0; i < SAMPLE_QUALITY; i++) {
    const angle = (i / SAMPLE_QUALITY) * 2 * Math.PI;

    const sampleX = x + Math.cos(angle) * radius;
    const sampleY = y + Math.sin(angle) * radius;

    // Convert to normalized coordinates
    const tx = sampleX / canvasWidth;
    const ty = sampleY / canvasHeight;

    // Check bounds
    if (tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1) {
      const hexColor = readPixelFromBuffer(pixelBuffer, canvasWidth, canvasHeight, tx, ty);
      totalLightness += lightness(hexColor);
      sampleCount++;
    }
  }

  return sampleCount > 0 ? totalLightness / sampleCount : 0;
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

// Global character matcher instance (created once for performance)

export interface CharacterSamplingData {
  samplingVector: number[];
  externalSamplingVector: number[];
}

export interface GenerationResult {
  ascii: string;
  metadata: {
    width: number; // character width relative to font size<
    height: number; // character height relative to font size
  };
  samplingData: CharacterSamplingData[][];
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
}

export type VisualizationMode = "raw" | "crunched";

export function generateAsciiChars(
  matcher: CharacterMatcher,
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  fontSize: number,
  characterWidth: number,
  alphabet: AlphabetName,
  characterWidthMultiplier: number,
  characterHeightMultiplier: number,
  enableVisualization?: boolean,
  visualizationMode?: VisualizationMode,
  lightnessEasingFunction?: string,
): GenerationResult {
  const metadata = getAlphabetMetadata(alphabet);
  const samplingConfig = metadata.samplingConfig;

  const chars: string[] = [];

  const sampleRectWidth = fontSize * metadata.width;
  const sampleRectHeight = fontSize * metadata.height;
  const boxWidth = sampleRectWidth * characterWidthMultiplier;
  const boxHeight = sampleRectHeight * characterHeightMultiplier;
  const letterWidth = characterWidth;
  const difference = (metadata.width * characterWidthMultiplier - letterWidth) / 2;
  const sampleRectXOff = (boxWidth - sampleRectWidth) / 2;
  const sampleRectYOff = (boxHeight - sampleRectHeight) / 2;

  const samplingRadius = fontSize * metadata.samplingConfig.circleRadius;

  let cols = Math.ceil(canvasWidth / boxWidth);
  let rows = Math.ceil(canvasHeight / boxHeight);

  if (cols % 2 === 0) cols += 1;
  if (rows % 2 === 0) rows += 1;

  const samplingData: CharacterSamplingData[][] = [];

  const easingLookupTable =
    lightnessEasingFunction && lightnessEasingFunction in easingLookupTables
      ? easingLookupTables[lightnessEasingFunction]
      : null;

  const colMid = cols / 2;
  const rowMid = rows / 2;

  const xMid = colMid * boxWidth;
  const yMid = rowMid * boxHeight;

  const offsetX = canvasWidth / 2 - xMid;
  const offsetY = canvasHeight / 2 - yMid;

  console.log(boxHeight, boxWidth);
  function createSamplingVector(
    col: number,
    row: number,
    points: { x: number; y: number }[],
  ): number[] {
    const vector: number[] = [];

    const left = clamp(col * boxWidth - difference * fontSize + offsetX, 0, canvasWidth);
    const top = clamp(row * boxHeight + offsetY, 0, canvasHeight);
    const sampleRectLeft = left + sampleRectXOff;
    const sampleRectTop = top + sampleRectYOff;

    for (const point of points) {
      const centerX = sampleRectLeft + point.x * sampleRectWidth;
      const centerY = sampleRectTop + point.y * sampleRectHeight;

      const lightness = sampleCircularRegion(
        pixelBuffer,
        canvasWidth,
        canvasHeight,
        centerX,
        centerY,
        samplingRadius,
      );

      vector.push(lightness);
    }

    return vector;
  }

  for (let row = 0; row < rows; row++) {
    const samplingDataRow: CharacterSamplingData[] = [];
    samplingData.push(samplingDataRow);

    for (let col = 0; col < cols; col++) {
      const rawSamplingVector = createSamplingVector(col, row, samplingConfig.points);

      let samplingVector = [...rawSamplingVector];

      // Apply lightness easing function if specified
      if (easingLookupTable) {
        samplingVector = samplingVector.map((value) => applyEasingLookup(value, easingLookupTable));
        // samplingVector = samplingVector.map((value) => clamp(value - 0.01, 0, 1));
      }

      let externalSamplingVector: number[] = [];
      if ("externalPoints" in samplingConfig) {
        externalSamplingVector = createSamplingVector(col, row, samplingConfig.externalPoints);
        samplingVector = crunchSamplingVectorDirectional(
          samplingVector,
          externalSamplingVector,
          CONTRAST_EXPONENT_LOCAL,
        );
      }
      samplingVector = crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);

      // Find best matching character using K-d tree
      let selectedChar = matcher.findBestCharacter(samplingVector);

      // Collect visualization data if enabled
      if (enableVisualization) {
        const vectorToStore = visualizationMode === "crunched" ? samplingVector : rawSamplingVector;
        samplingDataRow.push({ samplingVector: vectorToStore, externalSamplingVector });
      }

      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);
    }
    chars.push("\n");
  }

  const ascii = chars.join("");
  return {
    ascii,
    metadata: {
      width: metadata.width,
      height: metadata.height,
    },
    samplingData,
    cols,
    rows,
    offsetX,
    offsetY,
  };
}
