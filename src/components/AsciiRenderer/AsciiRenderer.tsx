import { useEffect, useMemo, useRef } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars, VisualizationMode } from "./ascii/generateAsciiChars";
import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { cssVariables } from "../../utils/cssVariables";
import { useMonospaceCharacterWidthEm } from "../../utils/hooks/useMonospaceCharacterWidthEm";
import { SamplingPointCanvas, renderSamplingPoints } from "./visualizeSampling";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { EFFECTS } from "./ascii/effects";

interface Props {
  alphabet: AlphabetName;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
  fontSize?: number;
  characterWidthMultiplier: number;
  characterHeightMultiplier: number;
  showSamplingPoints?: VisualizationMode;
  showExternalPoints?: boolean;
  lightnessEasingFunction?: string;
}

export function AsciiRenderer(props: Props) {
  const { alphabet, fontSize = 14, characterHeightMultiplier, characterWidthMultiplier } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const samplingCanvasRef = useRef<HTMLCanvasElement>(null);
  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const characterWidth = useMonospaceCharacterWidthEm(cssVariables.fontMonospace);

  const { canvasRef } = useCanvasContext();

  const characterMatcher = useMemo(() => {
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet(alphabet, [EFFECTS.componentWiseGlobalNormalization]);
    return matcher;
  }, [alphabet]);

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

      const enableVisualization = !!props.showSamplingPoints || props.showExternalPoints;

      const renderedCharWidth = fontSize * metadata.width * characterWidthMultiplier;
      const renderedCharHeight = fontSize * metadata.height * characterHeightMultiplier;

      let cols = Math.ceil(containerRect.width / renderedCharWidth);
      let rows = Math.ceil(containerRect.height / renderedCharHeight);

      if (cols % 2 === 0) cols += 1;
      if (rows % 2 === 0) rows += 1;

      const result = generateAsciiChars(
        characterMatcher,
        pixelBuffer,
        canvas.width,
        canvas.height,
        cols,
        rows,
        alphabet,
        enableVisualization,
        props.showSamplingPoints,
        props.lightnessEasingFunction,
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

      // Render sampling points directly to canvas if visualization is enabled
      if (props.showSamplingPoints && samplingCanvasRef.current && characterWidth != null) {
        renderSamplingPoints(
          samplingCanvasRef.current,
          result.samplingData,
          alphabet,
          fontSize,
          characterWidthMultiplier,
          characterHeightMultiplier,
          characterWidth,
          containerRect.width,
          containerRect.height,
          horizontalOffset,
          verticalOffset,
        );
      }
    };
  }, [
    alphabet,
    metadata,
    props.showSamplingPoints,
    props.showExternalPoints,
    props.lightnessEasingFunction,
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
      </div>
      {props.showSamplingPoints && <SamplingPointCanvas onCanvasRef={samplingCanvasRef} />}
    </div>
  );
}
