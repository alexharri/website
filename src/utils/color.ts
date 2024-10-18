import { colors } from "./cssVariables";

export function parseColor(colorKey: string) {
  const parts = colorKey.split(".");
  let curr: any = colors;
  for (const part of parts) {
    curr = curr[part];
    if (curr == null) break;
  }
  return curr ?? colorKey;
}
