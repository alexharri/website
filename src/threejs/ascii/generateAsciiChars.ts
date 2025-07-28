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

const ANTI_ALIASING_QUALITY = 3;

export function generateAsciiChars(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  outputWidth: number,
  outputHeight: number,
): string {
  const chars: string[] = [];

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const avgLightness = samplePixelWithAntiAliasing(
        pixelBuffer,
        canvasWidth,
        canvasHeight,
        x,
        y,
        outputWidth,
        outputHeight,
        ANTI_ALIASING_QUALITY,
      );
      const char = getChar(avgLightness);
      chars.push(char === "&nbsp;" ? " " : char);
    }
    chars.push("\n");
  }

  return chars.join(" ");
}
