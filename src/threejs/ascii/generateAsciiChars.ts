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

function getChar(lightness: number): string {
  const chars = " .'`^\",:;Il!i><~+_-?]";
  const index = Math.floor(lightness * (chars.length - 1));
  return chars[index] === " " ? "&nbsp;" : chars[index];
}

function samplePixelWithAntiAliasing(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  W: number,
  H: number,
  quality: number,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  for (let sy = 0; sy < quality; sy++) {
    for (let sx = 0; sx < quality; sx++) {
      const offsetX = (sx + 0.5) / quality;
      const offsetY = (sy + 0.5) / quality;

      const x_t = (x + offsetX) / W;
      const y_t = (y + offsetY) / H;

      const hexColor = readPixelFromBuffer(pixelBuffer, canvasWidth, canvasHeight, x_t, y_t);
      totalLightness += lightness(hexColor);
      sampleCount++;
    }
  }

  return totalLightness / sampleCount;
}

import { CharacterMatcher, SamplingPoint } from './CharacterMatcher';

const ANTI_ALIASING_QUALITY = 3;

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

// Global character matcher instance (created once for performance)
let characterMatcher: CharacterMatcher | null = null;

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
): string {
  const matcher = getCharacterMatcher();
  const samplingConfig = matcher.getSamplingConfig();
  const chars: string[] = [];

  // Calculate character dimensions in pixels
  const charWidth = canvasWidth / outputWidth;
  const charHeight = canvasHeight / outputHeight;

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      // Create sampling vector for this character position
      const samplingVector = createSamplingVector(
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
      
      // Find best matching character using K-d tree
      const char = matcher.findBestCharacter(samplingVector);
      chars.push(char === "&nbsp;" ? " " : char);
    }
    chars.push("\n");
  }

  return chars.join("");
}
