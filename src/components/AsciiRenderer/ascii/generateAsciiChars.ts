import { CharacterMatcher, SamplingPoint } from "./CharacterMatcher";
import Bezier from "bezier-easing";
import { AlphabetName, getAlphabetMetadata } from "../alphabets/AlphabetManager";

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
  centerX: number,
  centerY: number,
  radius: number,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  // Always sample center point
  const centerX_t = centerX / canvasWidth;
  const centerY_t = centerY / canvasHeight;
  const centerColor = readPixelFromBuffer(
    pixelBuffer,
    canvasWidth,
    canvasHeight,
    centerX_t,
    centerY_t,
  );
  totalLightness += lightness(centerColor);
  sampleCount++;

  // Sample at edge of circle at evenly spaced angles
  for (let i = 0; i < SAMPLE_QUALITY; i++) {
    const angle = (i / SAMPLE_QUALITY) * 2 * Math.PI;

    const sampleX = centerX + Math.cos(angle) * radius;
    const sampleY = centerY + Math.sin(angle) * radius;

    // Convert to normalized coordinates
    const x_t = sampleX / canvasWidth;
    const y_t = sampleY / canvasHeight;

    // Check bounds
    if (x_t >= 0 && x_t <= 1 && y_t >= 0 && y_t <= 1) {
      const hexColor = readPixelFromBuffer(pixelBuffer, canvasWidth, canvasHeight, x_t, y_t);
      totalLightness += lightness(hexColor);
      sampleCount++;
    }
  }

  return sampleCount > 0 ? totalLightness / sampleCount : 0;
}

function createSamplingVector(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  charX: number,
  charY: number,
  charWidth: number,
  charHeight: number,
  samplingPoints: SamplingPoint[],
  samplingRadius: number,
): number[] {
  const vector: number[] = [];

  for (const point of samplingPoints) {
    // Convert normalized character coordinates to pixel coordinates
    const pixelX = charX * charWidth + point.x * charWidth;
    const pixelY = charY * charHeight + point.y * charHeight;

    // Sample the circular region at this point
    const lightness = sampleCircularRegion(
      pixelBuffer,
      canvasWidth,
      canvasHeight,
      pixelX,
      pixelY,
      samplingRadius,
    );

    vector.push(lightness);
  }

  return vector;
}

function sampleDirectionalContext(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  charX: number,
  charY: number,
  charWidth: number,
  charHeight: number,
  externalPoints: SamplingPoint[],
  samplingRadius: number,
): number[] {
  const contextValues: number[] = [];

  for (const externalPoint of externalPoints) {
    // Calculate actual external sampling position in pixels
    const externalX = charX * charWidth + externalPoint.x * charWidth;
    const externalY = charY * charHeight + externalPoint.y * charHeight;

    // Sample the external context point
    const contextLightness = sampleCircularRegion(
      pixelBuffer,
      canvasWidth,
      canvasHeight,
      externalX,
      externalY,
      samplingRadius,
    );

    contextValues.push(contextLightness);
  }

  return contextValues;
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
}

export interface GenerationResult {
  ascii: string;
  metadata: {
    width: number; // character width relative to font size<
    height: number; // character height relative to font size
  };
  samplingData: CharacterSamplingData[][];
}

export type VisualizationMode = "raw" | "crunched";

export function generateAsciiChars(
  matcher: CharacterMatcher,
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  columns: number,
  rows: number,
  alphabet: AlphabetName,
  enableVisualization?: boolean,
  visualizationMode?: VisualizationMode,
  lightnessEasingFunction?: string,
): GenerationResult {
  const metadata = getAlphabetMetadata(alphabet);
  const samplingConfig = metadata.samplingConfig;

  const chars: string[] = [];

  // Calculate base character dimensions in pixels
  const baseCharWidth = canvasWidth / columns;
  const baseCharHeight = canvasHeight / rows;

  // Adjust character width based on metadata for proper sampling, keep height unchanged
  const charWidth = baseCharWidth * metadata.width;
  const charHeight = baseCharHeight;

  // Scale the normalized circle radius to pixels based on character size
  // The circle radius in metadata is relative to font size, so we scale by character dimensions
  const circleRadiusInPixels = samplingConfig.circleRadius * Math.min(charWidth, charHeight);

  const samplingData: CharacterSamplingData[][] = [];

  // Pre-compute easing lookup table once
  const easingLookupTable =
    lightnessEasingFunction && lightnessEasingFunction in easingLookupTables
      ? easingLookupTables[lightnessEasingFunction]
      : null;

  for (let y = 0; y < rows; y++) {
    const samplingDataRow: CharacterSamplingData[] = [];
    samplingData.push(samplingDataRow);

    for (let x = 0; x < columns; x++) {
      // Create sampling vector for this character position
      const rawSamplingVector = createSamplingVector(
        pixelBuffer,
        canvasWidth,
        canvasHeight,
        x,
        y,
        charWidth,
        charHeight,
        samplingConfig.points,
        circleRadiusInPixels,
      );

      let samplingVector = [...rawSamplingVector];

      // Apply lightness easing function if specified
      if (easingLookupTable) {
        // samplingVector = samplingVector.map((value) => applyEasingLookup(value, easingLookupTable));
        // samplingVector = samplingVector.map((value) => clamp(value - 0.01, 0, 1));
      }

      if ("externalPoints" in samplingConfig) {
        const contextValues = sampleDirectionalContext(
          pixelBuffer,
          canvasWidth,
          canvasHeight,
          x,
          y,
          charWidth,
          charHeight,
          samplingConfig.externalPoints,
          circleRadiusInPixels,
        );
        samplingVector = crunchSamplingVectorDirectional(
          samplingVector,
          contextValues,
          CONTRAST_EXPONENT_LOCAL,
        );
      }
      samplingVector = crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);

      // Find best matching character using K-d tree
      let selectedChar = matcher.findBestCharacter(samplingVector);

      // Collect visualization data if enabled
      if (enableVisualization) {
        const vectorToStore = visualizationMode === "crunched" ? samplingVector : rawSamplingVector;
        samplingDataRow.push({ samplingVector: vectorToStore });
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
  };
}
