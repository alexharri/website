import { useEffect, useMemo, useRef, useState } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars, CharacterSamplingData } from "./ascii/generateAsciiChars";
import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { colors, cssVariables } from "../../utils/cssVariables";
import { useMonospaceCharacterWidthEm } from "../../utils/hooks/useMonospaceCharacterWidthEm";

interface Props {
  alphabet: AlphabetName;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
  fontSize?: number;
  characterWidthMultiplier: number;
  characterHeightMultiplier: number;
  showSamplingPoints?: boolean;
  showExternalPoints?: boolean;
}

export function AsciiRenderer(props: Props) {
  const { alphabet, fontSize = 14, characterHeightMultiplier, characterWidthMultiplier } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const [samplingData, setSamplingData] = useState<CharacterSamplingData[][]>([]);
  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const characterWidth = useMonospaceCharacterWidthEm(cssVariables.fontMonospace);

  const { canvasRef } = useCanvasContext();

  useEffect(() => {
    props.onFrameRef.current = function onFrame(pixelBuffer: Uint8Array): void {
      const container = containerRef.current;
      const content = contentRef.current;
      const preEl = preRef.current;
      if (!container || !content || !preEl || characterWidth == null) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;

      const enableVisualization = props.showSamplingPoints || props.showExternalPoints;

      const renderedCharWidth = fontSize * metadata.width * characterWidthMultiplier;
      const renderedCharHeight = fontSize * metadata.height * characterHeightMultiplier;

      let cols = Math.ceil(containerRect.width / renderedCharWidth);
      let rows = Math.ceil(containerRect.height / renderedCharHeight);

      if (cols % 2 === 0) cols += 1;
      if (rows % 2 === 0) rows += 1;

      const result = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        cols,
        rows,
        alphabet,
        enableVisualization,
      );

      preEl.textContent = result.ascii;

      const adjustedWidth = result.metadata.width * characterWidthMultiplier;
      const adjustedHeight = result.metadata.height * characterHeightMultiplier;
      const letterSpacing = `${adjustedWidth - characterWidth}em`;
      const lineHeight = adjustedHeight;

      preEl.style.letterSpacing = letterSpacing;
      preEl.style.lineHeight = lineHeight.toString();
      preEl.style.fontSize = props.fontSize ? `${props.fontSize}px` : "14px";

      const colMid = cols / 2;
      const rowMid = rows / 2;

      const xMid = colMid * adjustedWidth * fontSize;
      const yMid = rowMid * adjustedHeight * fontSize;

      const horizontalOffset = containerRect.width / 2 - xMid;
      const verticalOffset = containerRect.height / 2 - yMid;

      content.style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;

      setSamplingData(result.samplingData);
    };
  }, [
    alphabet,
    metadata,
    props.showSamplingPoints,
    props.showExternalPoints,
    fontSize,
    characterWidthMultiplier,
    characterHeightMultiplier,
    characterWidth,
  ]);

  return (
    <div
      data-ascii
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    >
      <div className={s("content")} ref={contentRef}>
        <pre ref={preRef} className={s("pre")} />
        {characterWidth != null && samplingData.length > 0 && (
          <div className={s("visualizationLayer")}>
            {samplingData
              .map((row, y) =>
                row.map(({ samplingVector }, x) => {
                  const sampleRectWidth = fontSize * metadata.width;
                  const sampleRectHeight = fontSize * metadata.height;
                  const boxWidth = sampleRectWidth * characterWidthMultiplier;
                  const boxHeight = sampleRectHeight * characterHeightMultiplier;
                  const letterWidth = characterWidth;
                  const difference = (metadata.width * characterWidthMultiplier - letterWidth) / 2;
                  const left = x * boxWidth - difference * fontSize;
                  const top = y * boxHeight;
                  const sampleRectXOff = (boxWidth - sampleRectWidth) / 2;
                  const sampleRectYOff = (boxHeight - sampleRectHeight) / 2;
                  const samplingCircleWidth = fontSize * metadata.samplingConfig.circleRadius * 2;
                  return (
                    <div
                      key={[x, y].join(",")}
                      style={{
                        position: "absolute",
                        width: boxWidth,
                        height: boxHeight,
                        left,
                        top,
                        // border: "1px solid red",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          width: sampleRectWidth,
                          height: sampleRectHeight,
                          left: sampleRectXOff,
                          top: sampleRectYOff,
                          // border: "1px solid lightgreen",
                        }}
                      >
                        {metadata.samplingConfig.points.map(({ x, y }, i) => (
                          <div
                            key={i}
                            className={s("samplingPoint")}
                            style={{
                              left: x * 100 + "%",
                              top: y * 100 + "%",
                              width: samplingCircleWidth,
                              height: samplingCircleWidth,
                              border: `1px solid rgba(255, 255, 255, 0.2)`,
                              backgroundColor: colors.background200,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: "50%",
                                backgroundColor: `rgba(255, 255, 255, ${samplingVector[i] * 0.7})`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }),
              )
              .flat()}
          </div>
        )}
      </div>
    </div>
  );
}
