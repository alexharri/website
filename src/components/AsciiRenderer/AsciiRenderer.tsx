import { useEffect, useRef, useState } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars, VisualizationData } from "./ascii/generateAsciiChars";
import { AlphabetName } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";

interface Props {
  alphabet: AlphabetName;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
  fontSize?: number;
  showSamplingPoints?: boolean;
  showExternalPoints?: boolean;
  characterWidthMultiplier?: number;
  characterHeightMultiplier?: number;
}

export function AsciiRenderer(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const { canvasRef } = useCanvasContext();

  useEffect(() => {
    props.onFrameRef.current = function onFrame(pixelBuffer: Uint8Array): void {
      const container = ref.current;
      const preEl = preRef.current;
      if (!container || !preEl) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;

      const enableVisualization = props.showSamplingPoints || props.showExternalPoints;
      const tempResult = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        1,
        1,
        props.alphabet,
        false,
      );

      const fontSize = props.fontSize || 14;
      const baseCharWidth = fontSize;
      const baseCharHeight = fontSize;
      const characterWidthMultiplier = props.characterWidthMultiplier ?? 0.7;
      const characterHeightMultiplier = props.characterHeightMultiplier ?? 1.0;
      const widthMultiplier = characterWidthMultiplier;
      const heightMultiplier = characterHeightMultiplier;

      const canvasAspectRatio = canvas.width / canvas.height;
      const containerAspectRatio = containerRect.width / containerRect.height;

      let effectiveWidth, effectiveHeight;
      if (containerAspectRatio > canvasAspectRatio) {
        effectiveHeight = containerRect.height;
        effectiveWidth = effectiveHeight * canvasAspectRatio;
      } else {
        effectiveWidth = containerRect.width;
        effectiveHeight = effectiveWidth / canvasAspectRatio;
      }

      const renderedCharWidth = baseCharWidth * widthMultiplier;
      const renderedCharHeight = baseCharHeight * tempResult.metadata.height * heightMultiplier;

      let W = Math.floor(effectiveWidth / renderedCharWidth);
      let H = Math.floor(effectiveHeight / renderedCharHeight);

      if (W % 2 === 1) W += 1;
      if (H % 2 === 1) H += 1;

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

      const actualMonospaceWidth = 0.6;
      const adjustedWidth = result.metadata.width * widthMultiplier;
      const adjustedHeight = result.metadata.height * heightMultiplier;
      const letterSpacing = `${adjustedWidth - actualMonospaceWidth}em`;
      const lineHeight = adjustedHeight;

      preEl.style.letterSpacing = letterSpacing;
      preEl.style.lineHeight = lineHeight.toString();
      preEl.style.fontSize = props.fontSize ? `${props.fontSize}px` : "14px";

      const middleCharX = (W - 1) / 2;
      const middleCharY = (H - 1) / 2;

      const middleCharPixelX = middleCharX * adjustedWidth * fontSize;
      const middleCharPixelY = middleCharY * adjustedHeight * fontSize;

      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;

      const horizontalOffset = containerCenterX - middleCharPixelX;
      const verticalOffset = containerCenterY - middleCharPixelY;

      preEl.style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;

      if (enableVisualization && result.visualization) {
        setVisualizationData(result.visualization);
      } else {
        setVisualizationData(null);
      }
    };
  }, [
    props.alphabet,
    props.showSamplingPoints,
    props.showExternalPoints,
    props.fontSize,
    props.characterWidthMultiplier,
    props.characterHeightMultiplier,
  ]);

  return (
    <div
      data-ascii
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    >
      <pre ref={preRef} className={s("pre")} />
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
