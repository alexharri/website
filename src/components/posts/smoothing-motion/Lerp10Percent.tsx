import { lerp } from "../../../math/lerp";
import { createCanvas } from "./Canvas";

export const Lerp10Percent = createCanvas(() => {
  let prev: { x: number; y: number } | null = null;
  return (x, y) => {
    prev ??= { x, y };
    prev.x = lerp(prev.x, x, 0.1);
    prev.y = lerp(prev.y, y, 0.1);
    return [prev.x, prev.y];
  };
});
