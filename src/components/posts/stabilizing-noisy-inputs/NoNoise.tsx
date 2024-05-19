import { createGridExample } from "./generators/GridExample";

export const NoNoise = createGridExample(
  () => {
    return () => [0, 0];
  },
  { margin: true },
);

export const NoNoiseShowBoundaries = createGridExample(
  () => {
    return () => [0, 0];
  },
  { margin: true, showBoundaries: true },
);
