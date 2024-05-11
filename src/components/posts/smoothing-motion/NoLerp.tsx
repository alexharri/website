import { createCanvas } from "./Canvas";

export const NoLerp = createCanvas(() => {
  return (x, y) => [x, y];
});
