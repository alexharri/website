import { useEffect, useRef, useState } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars, VisualizationData } from "./ascii/generateAsciiChars";
import { AlphabetName } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";

interface Props {
  alphabet: AlphabetName;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
  fontSize?: number;
  showSamplingPoints?: boolean;
  showExternalPoints?: boolean;
  characterWidthPx?: number;
}

export function AsciiRenderer(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);

  useEffect(() => {
    let charDimensions: { width: number; height: number } | null = null;

    props.onFrameRef.current = function onFrame(pixelBuffer: Uint8Array): void {
      const container = ref.current;
      const preEl = preRef.current;
      if (!container || !preEl) return;

      const canvas = props.canvasRef.current;
      if (!canvas) return;

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;

      // Get metadata first to calculate character dimensions
      const enableVisualization = props.showSamplingPoints || props.showExternalPoints;
      const tempResult = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        1, // temporary values to get metadata
        1,
        props.alphabet,
        false, // don't need visualization for metadata
      );

      // Calculate character dimensions from metadata and fontSize
      const fontSize = props.fontSize || 14;
      const baseCharWidth = fontSize; // 1em in pixels
      const baseCharHeight = fontSize; // 1em in pixels
      const characterWidthPx = props.characterWidthPx ?? 10;
      const widthMultiplier = characterWidthPx / baseCharWidth;

      charDimensions = {
        width: baseCharWidth * tempResult.metadata.width * widthMultiplier,
        height: baseCharHeight * tempResult.metadata.height,
      };

      // Calculate how many "standard" characters would fit, maintaining canvas aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      const containerAspectRatio = containerRect.width / containerRect.height;

      let effectiveWidth, effectiveHeight;
      if (containerAspectRatio > canvasAspectRatio) {
        // Container is wider than canvas aspect ratio
        effectiveHeight = containerRect.height;
        effectiveWidth = effectiveHeight * canvasAspectRatio;
      } else {
        // Container is taller than canvas aspect ratio
        effectiveWidth = containerRect.width;
        effectiveHeight = effectiveWidth / canvasAspectRatio;
      }

      // Use the actual rendered character dimensions for grid calculation
      // Width: account for letterSpacing and width multiplier
      // Height: use actual line height from metadata
      const renderedCharWidth = baseCharWidth * widthMultiplier;
      const renderedCharHeight = baseCharHeight * tempResult.metadata.height;

      const W = Math.floor(effectiveWidth / renderedCharWidth);
      const H = Math.floor(effectiveHeight / renderedCharHeight);

      const result = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        W,
        H,
        props.alphabet,
        enableVisualization,
      );

      preEl.textContent = result.ascii;

      // Set CSS properties directly
      const actualMonospaceWidth = 0.6; // actual width of monospace characters in em
      const adjustedWidth = result.metadata.width * widthMultiplier;
      const letterSpacing = `${adjustedWidth - actualMonospaceWidth}em`;
      const lineHeight = result.metadata.height;

      preEl.style.letterSpacing = letterSpacing;
      preEl.style.lineHeight = lineHeight.toString();
      preEl.style.fontSize = props.fontSize ? `${props.fontSize}px` : "14px";
      
      if (enableVisualization && result.visualization) {
        setVisualizationData(result.visualization);
      } else {
        setVisualizationData(null);
      }
    };
  }, [props.alphabet, props.showSamplingPoints, props.showExternalPoints, props.fontSize, props.characterWidthPx]);

  return (
    <div
      data-ascii
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    >
      <pre
        ref={preRef}
        className={s("pre")}
      />
      {visualizationData && (
        <div className={s("visualizationLayer")}>
          {visualizationData.samplingPoints.map((point, index) => {
            const shouldShow = point.isExternal
              ? props.showExternalPoints
              : props.showSamplingPoints;
            if (!shouldShow) return null;

            return (
              <div
                key={index}
                className={s("samplingPoint")}
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                  backgroundColor: point.isExternal
                    ? `rgba(255, 100, 100, ${Math.max(0.3, point.lightness)})`
                    : `rgba(100, 255, 100, ${Math.max(0.3, point.lightness)})`,
                  border: `1px solid ${point.isExternal ? "#ff6464" : "#64ff64"}`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
