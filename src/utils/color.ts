import { colors } from "./cssVariables";
import { hexColorRegex } from "./regex";

export function parseColor(colorKey: string) {
  const parts = colorKey.split(".");
  let curr: any = colors;
  for (const part of parts) {
    curr = curr[part];
    if (curr == null) break;
  }
  return curr ?? colorKey;
}

type RgbColor = [number, number, number];

export function hexToRgb(hex: string): RgbColor {
  const match = hexColorRegex.exec(hex);
  if (match == null) {
    throw new Error(`Failed to parse '${hex}' as a hex color`);
  }
  return [1, 2, 3].map((i) => parseInt(match[i], 16)) as RgbColor;
}

export function hexToRgbaString(hex: string, alpha: number): string {
  const match = hexColorRegex.exec(hex);
  if (match == null) {
    throw new Error(`Failed to parse '${hex}' as a hex color`);
  }
  const rgb = [1, 2, 3].map((i) => parseInt(match[i], 16));
  return `rgba(${rgb.join(", ")}, ${alpha})`;
}

export function hexToBinary(hex: string): number {
  const match = hexColorRegex.exec(hex);
  if (match == null) {
    throw new Error(`Failed to parse '${hex}' as a hex color`);
  }
  return Number("0x" + [1, 2, 3].map((i) => match[i]).join(""));
}
