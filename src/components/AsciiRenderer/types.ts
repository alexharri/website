export type SamplingPointVisualizationMode = "none" | "raw" | "crunched";

export enum SamplingEffect {
  Crunch = "crunch",
}

export interface DebugVizOptions {
  showSamplingCircles: SamplingPointVisualizationMode;
  showExternalSamplingCircles: boolean;
  showSamplingPoints: boolean;
  showGrid: boolean;
  pixelate: boolean;
}
