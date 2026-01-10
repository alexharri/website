import { useCallback, useState, useRef, useEffect } from "react";
import {
  generateSamplingData,
  CharacterSamplingData,
} from "../../components/AsciiRenderer/ascii/generateAsciiChars";
import { AsciiRenderConfig } from "../../components/AsciiRenderer/renderConfig";
import { renderAsciiDebugViz } from "../../components/AsciiRenderer/asciiDebugViz";
import { DebugVizOptions, SamplingEffect } from "../../components/AsciiRenderer/types";
import { GPUSamplingDataGenerator } from "../../components/AsciiRenderer/gpu/GPUSamplingDataGenerator";
import { Observer } from "../observer";
import { OnFrameSource, OnFrameOptions } from "../../contexts/CanvasContext";

interface SamplingRefs {
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
}

interface UseSamplingDataCollectionParams {
  samplingDataObserver: Observer<CharacterSamplingData[][]>;
  refs: SamplingRefs;
  config: AsciiRenderConfig | null;
  debugVizOptions: DebugVizOptions;
  increaseContrast: boolean;
  forceSamplingValue?: number;
  hideSpaces: boolean;
  samplingEffects: SamplingEffect[];
  optimizePerformance: boolean;
  globalCrunchExponent: number;
  directionalCrunchExponent: number;
}

export function useSamplingDataCollection(params: UseSamplingDataCollectionParams) {
  const {
    samplingDataObserver,
    refs,
    config,
    debugVizOptions,
    increaseContrast,
    forceSamplingValue,
    samplingEffects,
    optimizePerformance,
    globalCrunchExponent,
    hideSpaces,
    directionalCrunchExponent,
  } = params;
  const { debugCanvasRef } = refs;

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
    if (!config || !optimizePerformance || !webgl2SupportedRef.current) {
      return;
    }

    try {
      // Create offscreen canvas for GPU operations
      if (!gpuCanvasRef.current) {
        gpuCanvasRef.current = document.createElement("canvas");
        gpuCanvasRef.current.width = config.canvasWidth;
        gpuCanvasRef.current.height = config.canvasHeight;
      }

      gpuGeneratorRef.current?.dispose();

      const { canvasWidth, canvasHeight, samplingQuality } = config;
      gpuGeneratorRef.current = new GPUSamplingDataGenerator(gpuCanvasRef.current, {
        config,
        canvasWidth,
        canvasHeight,
        pixelBufferScale: 1, // Will be updated per frame
        samplingQuality,
        samplingEffects,
        globalCrunchExponent,
        directionalCrunchExponent,
      });
    } catch (error) {
      console.error("Failed to initialize GPU sampling:", error);
      gpuGeneratorRef.current = null;
    }

    return () => {
      gpuGeneratorRef.current?.dispose();
      gpuGeneratorRef.current = null;
    };
  }, [shouldUseGPU, config, increaseContrast, samplingEffects]);

  useEffect(() => {
    if (gpuGeneratorRef.current) {
      gpuGeneratorRef.current.updateExponents(globalCrunchExponent, directionalCrunchExponent);
    }
  }, [globalCrunchExponent, directionalCrunchExponent]);

  const lastFrameRef = useRef<{ source: OnFrameSource; options: OnFrameOptions } | null>(null);

  const onSamplingData = useCallback(
    (samplingData: CharacterSamplingData[][]) => {
      if (!config) return;

      samplingDataObserver.emit(samplingData);

      if (debugCanvasRef.current) {
        renderAsciiDebugViz(
          debugCanvasRef.current,
          samplingData,
          config,
          debugVizOptions,
          hideSpaces,
          forceSamplingValue,
        );
      }
    },
    [debugCanvasRef, config, debugVizOptions, forceSamplingValue],
  );

  const onFrame = useCallback(
    (source: OnFrameSource, options: OnFrameOptions) => {
      lastFrameRef.current = { source, options };
      if (!config) return;

      const pixelBufferScale = options.canvasWidth / config.canvasWidth;
      const canvasWidth = options.canvasWidth;
      const canvasHeight = options.canvasHeight;

      const gpuGenerator = gpuGeneratorRef.current;

      // Use GPU path if available and enabled
      let ranOnGPU = false;
      if (gpuGenerator) {
        try {
          gpuGenerator.update(
            source.buffer || source.canvas!,
            samplingData,
            options?.flipY ?? false,
            pixelBufferScale,
            canvasWidth,
            canvasHeight,
          );
          ranOnGPU = true;
        } catch (error) {
          console.error("GPU sampling failed:", error);
        }
      }
      if (!ranOnGPU) {
        const buffer = source.buffer || canvasToBuffer(source.canvas);
        generateSamplingData(
          samplingData,
          buffer,
          pixelBufferScale,
          config,
          debugVizOptions.showSamplingPoints,
          options?.flipY ?? false,
          globalCrunchExponent,
          directionalCrunchExponent,
          increaseContrast,
          samplingEffects,
        );
      }

      onSamplingData(samplingData);
    },
    [
      samplingDataObserver,
      debugCanvasRef,
      config,
      increaseContrast,
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

  return { onFrame, onSamplingData };
}

function canvasToBuffer(canvas: HTMLCanvasElement) {
  // Try to get existing contexts
  const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");

  const width = canvas.width;
  const height = canvas.height;

  if (gl) {
    // WebGL context
    const buffer = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    return buffer;
  }

  const ctx2d = canvas.getContext("2d");
  if (ctx2d) {
    // 2D context
    const imageData = ctx2d.getImageData(0, 0, width, height);
    return imageData.data;
  }

  throw new Error("Canvas has no rendering context");
}
