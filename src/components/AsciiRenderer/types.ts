export type SamplingPointVisualizationMode = "none" | "raw" | "crunched";

export interface DebugVizOptions {
  showSamplingCircles: SamplingPointVisualizationMode;
  showExternalSamplingCircles: boolean;
  showSamplingPoints: boolean;
}
