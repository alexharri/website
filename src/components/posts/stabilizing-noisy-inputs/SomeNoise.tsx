import { createWiggle } from "../../../math/wiggle";
import { createCanvas } from "./Canvas";

export const SomeNoise = createCanvas(() => {
  const speed = 3;
  const amplitude = 1;
  const wiggleX = createWiggle(speed, amplitude);
  const wiggleY = createWiggle(speed, amplitude);
  return () => {
    return [wiggleX(), wiggleY()];
  };
});
