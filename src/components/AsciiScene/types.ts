export enum SamplingEffect {
  Crunch = "crunch",
  GlobalCrunch = "global_crunch",
  DirectionalCrunch = "directional_crunch",
}

export interface DebugVizOptions {
  showSamplingCircles: boolean;
  samplingCirclesColor: "gray" | "blue" | "white";
  showExternalSamplingCircles: boolean;
  showSamplingPoints: boolean;
  showGrid: boolean | "dark";
  pixelate: boolean;
}
