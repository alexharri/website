import { useCallback } from "react";
import {
  generateSamplingData,
  CharacterSamplingData,
} from "../../components/AsciiRenderer/ascii/generateAsciiChars";
import { AsciiRenderConfig } from "../../components/AsciiRenderer/renderConfig";
import { renderAsciiDebugViz } from "../../components/AsciiRenderer/asciiDebugViz";
import {
  DebugVizOptions,
  SamplingPointVisualizationMode,
} from "../../components/AsciiRenderer/types";
import { OnFrameOptions } from "../../contexts/CanvasContext";

interface SamplingRefs {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  samplingDataRef: React.MutableRefObject<CharacterSamplingData[][]>;
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
  onFrameRef: React.MutableRefObject<
    null | ((buffer: Uint8Array, options?: OnFrameOptions) => void)
  >;
}

interface SamplingDebug {
  showSamplingPoints: boolean;
  showSamplingCircles: SamplingPointVisualizationMode | true;
  debugVizOptions: DebugVizOptions;
}

interface UseSamplingDataCollectionParams {
  refs: SamplingRefs;
  config: AsciiRenderConfig | null;
  debug: SamplingDebug;
  lightnessEasingFunction?: string;
}

export function useSamplingDataCollection(params: UseSamplingDataCollectionParams) {
  const { refs, config, debug, lightnessEasingFunction } = params;
  const { canvasRef, samplingDataRef, debugCanvasRef, onFrameRef } = refs;
  const { showSamplingPoints, showSamplingCircles, debugVizOptions } = debug;

  return useCallback(
    (buffer: Uint8Array, options?: { flipY?: boolean }) => {
      if (config != null) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pixelBufferScale = canvas.width / config.canvasWidth;

        const samplingData = generateSamplingData(
          buffer,
          pixelBufferScale,
          config,
          showSamplingPoints,
          options?.flipY ?? false,
          lightnessEasingFunction,
        );

        samplingDataRef.current = samplingData;

        if (debugCanvasRef.current) {
          renderAsciiDebugViz(
            debugCanvasRef.current,
            samplingData,
            config,
            debugVizOptions,
            showSamplingCircles === true ? "raw" : showSamplingCircles,
            undefined,
            undefined,
          );
        }
      }

      onFrameRef.current?.(buffer, options);
    },
    [
      canvasRef,
      samplingDataRef,
      debugCanvasRef,
      onFrameRef,
      config,
      lightnessEasingFunction,
      showSamplingPoints,
      showSamplingCircles,
      debugVizOptions,
    ],
  );
}
