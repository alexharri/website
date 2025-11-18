export type SamplingPointVisualizationMode = "none" | "raw" | "crunched";

export enum SamplingEffect {
  Crunch = "crunch",
  GlobalCrunch = "global_crunch",
  DirectionalCrunch = "directional_crunch",
}

export interface DebugVizOptions {
  showSamplingCircles: SamplingPointVisualizationMode;
  showExternalSamplingCircles: boolean;
  showSamplingPoints: boolean;
  showGrid: boolean;
  pixelate: boolean;
}
