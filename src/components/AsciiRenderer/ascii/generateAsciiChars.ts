import { CharacterMatcher, SamplingPoint } from "./CharacterMatcher";
import { AlphabetName } from "../alphabets/AlphabetManager";

const CONTRAST_EXPONENT_GLOBAL = 3;
const CONTRAST_EXPONENT_LOCAL = 7;
const STICKINESS_THRESHOLD = 0; // 0.02;

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
  // Much smaller radius and no anti-aliasing for speed
  const actualRadius = Math.min(radius, 3);
  let totalLightness = 0;
  let sampleCount = 0;

  // Sample fewer points, no anti-aliasing
  for (let sy = -actualRadius; sy <= actualRadius; sy += 2) {
    for (let sx = -actualRadius; sx <= actualRadius; sx += 2) {
      // Check if point is within circle
      if (sx * sx + sy * sy > actualRadius * actualRadius) continue;

      const sampleX = centerX + sx;
      const sampleY = centerY + sy;

      // Convert to normalized coordinates
      const x_t = sampleX / canvasWidth;
      const y_t = sampleY / canvasHeight;

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

  return vector.map((value, index) => {
    const contextValue = contextValues[index];
    if (contextValue <= value) return value;

    // Normalize using the contextual max
    const normalized = value / contextValue;
    // Apply power-law enhancement
    const enhanced = Math.pow(normalized, exponent);
    // Rescale back to original value's scale (not context scale)
    return enhanced * contextValue;
  });
}

function vectorDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

// Global character matcher instance (created once for performance)
let characterMatcher: CharacterMatcher | null = null;

// Persistent storage for character stickiness
let previousCharacters: string[][] = [];
let previousVectors: number[][][] = [];
let previousOutputWidth = 0;
let previousOutputHeight = 0;

function getCharacterMatcher(): CharacterMatcher {
  if (!characterMatcher) {
    characterMatcher = new CharacterMatcher();
  }
  return characterMatcher;
}

export function generateAsciiChars(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  outputWidth: number,
  outputHeight: number,
  alphabet?: AlphabetName,
): string {
  const matcher = getCharacterMatcher();

  // Switch to the requested alphabet if provided
  if (alphabet && alphabet !== matcher.getCurrentAlphabet()) {
    matcher.switchAlphabet(alphabet);
  }

  const samplingConfig = matcher.getSamplingConfig();
  const chars: string[] = [];

  // Check if dimensions changed and clear storage if needed
  if (outputWidth !== previousOutputWidth || outputHeight !== previousOutputHeight) {
    previousCharacters = [];
    previousVectors = [];
    previousOutputWidth = outputWidth;
    previousOutputHeight = outputHeight;
  }

  // Initialize storage arrays if empty
  if (previousCharacters.length === 0) {
    previousCharacters = Array(outputHeight)
      .fill(null)
      .map(() => Array(outputWidth).fill(""));
    previousVectors = Array(outputHeight)
      .fill(null)
      .map(() =>
        Array(outputWidth)
          .fill(null)
          .map(() => []),
      );
  }

  // Calculate character dimensions in pixels
  const charWidth = canvasWidth / outputWidth;
  const charHeight = canvasHeight / outputHeight;

  // Get external points from config (pre-calculated)

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
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
        samplingConfig.circleRadius,
      );

      let samplingVector = rawSamplingVector;
      if (samplingConfig.externalPoints) {
        const contextValues = sampleDirectionalContext(
          pixelBuffer,
          canvasWidth,
          canvasHeight,
          x,
          y,
          charWidth,
          charHeight,
          samplingConfig.externalPoints,
          samplingConfig.circleRadius,
        );
        samplingVector = crunchSamplingVectorDirectional(
          rawSamplingVector,
          contextValues,
          CONTRAST_EXPONENT_LOCAL,
        );
      }
      samplingVector = crunchSamplingVector(samplingVector, CONTRAST_EXPONENT_GLOBAL);

      // Find best matching character using K-d tree
      let selectedChar = matcher.findBestCharacter(samplingVector);

      // Apply stickiness to reduce jitter
      const previousChar = previousCharacters[y][x];
      const previousVector = previousVectors[y][x];

      if (previousChar && previousVector.length > 0) {
        const distance = vectorDistance(samplingVector, previousVector);
        if (distance < STICKINESS_THRESHOLD) {
          selectedChar = previousChar;
        }
      }

      // Update storage with current frame data
      previousCharacters[y][x] = selectedChar;
      previousVectors[y][x] = [...samplingVector];

      chars.push(selectedChar === "&nbsp;" ? " " : selectedChar);
    }
    chars.push("\n");
  }

  return chars.join("");
}
