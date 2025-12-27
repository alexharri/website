export type SamplingPointVisualizationMode = "none" | "raw" | "crunched";

export enum SamplingEffect {
  Crunch = "crunch",
  GlobalCrunch = "global_crunch",
  DirectionalCrunch = "directional_crunch",
}

export interface DebugVizOptions {
  showSamplingCircles: SamplingPointVisualizationMode;
  samplingCirclesColor: "gray" | "blue" | "white";
  showExternalSamplingCircles: boolean;
  showSamplingPoints: boolean;
  showGrid: boolean | "dark";
  pixelate: boolean;
}
