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
import { GPUSamplingDataGenerator } from "../../components/AsciiRenderer/gpu/GPUSamplingDataGenerator";
import { Observer } from "../observer";
import { OnFrameSource, OnFrameOptions } from "../../contexts/CanvasContext";

interface SamplingRefs {
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
}

interface SamplingDebug {
  showSamplingPoints: boolean;
  showSamplingCircles: SamplingPointVisualizationMode | true;
  debugVizOptions: DebugVizOptions;
}

interface UseSamplingDataCollectionParams {
  samplingDataObserver: Observer<CharacterSamplingData[][]>;
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
    samplingDataObserver,
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
  const { debugCanvasRef } = refs;
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
    if (!config) {
      return;
    }
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

  const lastFrameRef = useRef<{
    source: OnFrameSource;
    options: OnFrameOptions;
  } | null>(null);

  const onFrame = useCallback(
    (source: OnFrameSource, options: OnFrameOptions) => {
      lastFrameRef.current = { source, options };
      if (!config) return;

      const pixelBufferScale = options.canvasWidth / config.canvasWidth;
      const canvasWidth = options.canvasWidth;
      const canvasHeight = options.canvasHeight;

      // Extract the actual source (buffer or canvas)
      const actualSource = source.buffer || source.canvas!;

      // Use GPU path if available and enabled
      if (gpuGeneratorRef.current && shouldUseGPU) {
        try {
          gpuGeneratorRef.current.update(
            actualSource,
            samplingData,
            options?.flipY ?? false,
            pixelBufferScale,
            canvasWidth,
            canvasHeight,
          );
        } catch (error) {
          console.error("GPU sampling failed:", error);
          // Fallback to CPU only if we have a buffer
          if (source.buffer) {
            generateSamplingData(
              samplingData,
              source.buffer,
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
        }
      } else if (source.buffer) {
        // Use CPU path (only works with buffers)
        generateSamplingData(
          samplingData,
          source.buffer,
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

      samplingDataObserver.emit(samplingData);

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
    },
    [
      samplingDataObserver,
      debugCanvasRef,
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

  useEffect(() => {
    if (lastFrameRef.current) {
      const { source, options } = lastFrameRef.current;
      onFrame(source, options);
    }
  }, [onFrame]);

  return onFrame;
}
