import { createCanvas } from "./Canvas";

export const NoNoise = createCanvas(() => {
  return () => [0, 0];
});
