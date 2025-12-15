import { useCallback, useState, useRef, useEffect } from "react";
import {
  generateSamplingData,
  CharacterSamplingData,
} from "../../components/AsciiRenderer/ascii/generateAsciiChars";
import { AsciiRenderConfig } from "../../components/AsciiRenderer/renderConfig";
import { renderAsciiDebugViz } from "../../components/AsciiRenderer/asciiDebugViz";
import {
  DebugVizOptions,
  SamplingPointVisualizationMode,
  SamplingEffect,
} from "../../components/AsciiRenderer/types";
import { OnFrameOptions } from "../../contexts/CanvasContext";
import { GPUSamplingDataGenerator } from "../../components/AsciiRenderer/gpu/GPUSamplingDataGenerator";

interface SamplingRefs {
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
  forceSamplingValue?: number;
  samplingEffects?: SamplingEffect[];
  optimizePerformance?: boolean;
  globalCrunchExponent: number;
  directionalCrunchExponent: number;
}

export function useSamplingDataCollection(params: UseSamplingDataCollectionParams) {
  const {
    refs,
    config,
    debug,
    lightnessEasingFunction,
    forceSamplingValue,
    samplingEffects,
    optimizePerformance,
    globalCrunchExponent,
    directionalCrunchExponent,
  } = params;
  const { samplingDataRef, debugCanvasRef, onFrameRef } = refs;
  const { showSamplingPoints, showSamplingCircles, debugVizOptions } = debug;

  const [samplingData] = useState<CharacterSamplingData[][]>(() => {
    return [];
  });

  // GPU sampling generator (only created if optimizePerformance is true)
  const gpuGeneratorRef = useRef<GPUSamplingDataGenerator | null>(null);
  const gpuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webgl2SupportedRef = useRef<boolean | null>(null);

  // Check WebGL2 support once (client-side only)
  if (typeof window !== "undefined" && webgl2SupportedRef.current === null) {
    const testCanvas = document.createElement("canvas");
    const testGl = testCanvas.getContext("webgl2");
    webgl2SupportedRef.current = testGl !== null;
  }

  const shouldUseGPU = optimizePerformance && webgl2SupportedRef.current;

  // Initialize GPU generator when config changes
  useEffect(() => {
    if (shouldUseGPU && config) {
      try {
        // Create offscreen canvas for GPU operations
        if (!gpuCanvasRef.current) {
          gpuCanvasRef.current = document.createElement("canvas");
          gpuCanvasRef.current.width = config.canvasWidth;
          gpuCanvasRef.current.height = config.canvasHeight;
        }

        // Clean up existing generator
        if (gpuGeneratorRef.current) {
          gpuGeneratorRef.current.dispose();
        }

        // Create new generator
        gpuGeneratorRef.current = new GPUSamplingDataGenerator(gpuCanvasRef.current, {
          config,
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          pixelBufferScale: 1, // Will be updated per frame
          samplingQuality: config.samplingQuality,
          lightnessEasingFunction,
          samplingEffects: samplingEffects || [],
          globalCrunchExponent,
          directionalCrunchExponent,
        });
      } catch (error) {
        console.error("Failed to initialize GPU sampling:", error);
        gpuGeneratorRef.current = null;
      }
    }

    // Cleanup on unmount or when switching to CPU
    return () => {
      if (gpuGeneratorRef.current) {
        gpuGeneratorRef.current.dispose();
        gpuGeneratorRef.current = null;
      }
    };
  }, [shouldUseGPU, config, lightnessEasingFunction, samplingEffects]);

  // Update exponents dynamically without recreating the generator
  useEffect(() => {
    if (gpuGeneratorRef.current) {
      gpuGeneratorRef.current.updateExponents(globalCrunchExponent, directionalCrunchExponent);
    }
  }, [globalCrunchExponent, directionalCrunchExponent]);

  return useCallback(
    (
      buffer: Uint8Array,
      options: { flipY?: boolean; canvasWidth: number; canvasHeight: number },
    ) => {
      if (config != null) {
        const pixelBufferScale = options.canvasWidth / config.canvasWidth;
        const canvasWidth = options.canvasWidth;
        const canvasHeight = options.canvasHeight;

        // Use GPU path if available and enabled
        if (gpuGeneratorRef.current && shouldUseGPU) {
          try {
            gpuGeneratorRef.current.update(
              buffer,
              samplingData,
              options?.flipY ?? false,
              pixelBufferScale,
              canvasWidth,
              canvasHeight,
            );
          } catch (error) {
            console.error("GPU sampling failed, falling back to CPU:", error);
            // Fallback to CPU
            generateSamplingData(
              samplingData,
              buffer,
              pixelBufferScale,
              config,
              showSamplingPoints,
              options?.flipY ?? false,
              globalCrunchExponent,
              directionalCrunchExponent,
              lightnessEasingFunction,
              samplingEffects,
            );
          }
        } else {
          // Use CPU path
          generateSamplingData(
            samplingData,
            buffer,
            pixelBufferScale,
            config,
            showSamplingPoints,
            options?.flipY ?? false,
            globalCrunchExponent,
            directionalCrunchExponent,
            lightnessEasingFunction,
            samplingEffects,
          );
        }

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
            forceSamplingValue,
          );
        }
      }

      onFrameRef.current?.(buffer, options);
    },
    [
      samplingDataRef,
      debugCanvasRef,
      onFrameRef,
      config,
      lightnessEasingFunction,
      showSamplingPoints,
      showSamplingCircles,
      debugVizOptions,
      samplingEffects,
      shouldUseGPU,
      globalCrunchExponent,
      directionalCrunchExponent,
    ],
  );
}
