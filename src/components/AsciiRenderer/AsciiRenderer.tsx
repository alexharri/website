import { useEffect, useMemo, useRef } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars } from "./ascii/generateAsciiChars";
import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { cssVariables } from "../../utils/cssVariables";
import { useMonospaceCharacterWidthEm } from "../../utils/hooks/useMonospaceCharacterWidthEm";
import { SamplingPointCanvas, renderSamplingPoints } from "./visualizeSampling";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { EFFECTS } from "./ascii/effects";
import { AsciiRenderConfig } from "./renderConfig";
import { DebugVizOptions, SamplingPointVisualizationMode } from "./types";

interface Props {
  alphabet: AlphabetName;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
  fontSize?: number;
  characterWidthMultiplier: number;
  characterHeightMultiplier: number;
  showSamplingCircles?: SamplingPointVisualizationMode | true;
  showExternalSamplingCircles?: boolean;
  showSamplingPoints?: boolean;
  lightnessEasingFunction?: string;
  transparent: boolean;
}

export function AsciiRenderer(props: Props) {
  const {
    alphabet,
    fontSize = 14,
    characterHeightMultiplier,
    characterWidthMultiplier,
    showSamplingCircles = "none",
    showExternalSamplingCircles = false,
    showSamplingPoints = false,
    transparent,
  } = props;
  const debugVizOptions: DebugVizOptions = {
    showSamplingCircles: showSamplingCircles === true ? "raw" : showSamplingCircles,
    showExternalSamplingCircles,
    showSamplingPoints,
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const samplingCanvasRef = useRef<HTMLCanvasElement>(null);
  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const characterWidth = useMonospaceCharacterWidthEm(cssVariables.fontMonospace);

  const enableVisualization =
    debugVizOptions.showSamplingCircles !== "none" || debugVizOptions.showExternalSamplingCircles;

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

      const pixelBufferScale = canvas.width / containerRect.width;

      const samplingQuality = 8;

      const config = new AsciiRenderConfig(
        containerRect.width,
        containerRect.height,
        fontSize,
        characterWidth,
        alphabet,
        samplingQuality,
        characterWidthMultiplier,
        characterHeightMultiplier,
      );

      const result = generateAsciiChars(
        characterMatcher,
        pixelBuffer,
        pixelBufferScale,
        config,
        enableVisualization,
        debugVizOptions.showSamplingCircles,
        props.lightnessEasingFunction,
      );

      preEl.textContent = result.ascii;

      preEl.style.letterSpacing = config.letterSpacingEm + "em";
      preEl.style.lineHeight = config.lineHeight.toString();
      preEl.style.fontSize = config.fontSize + "px";

      content.style.transform = `translate(${config.offsetX}px, ${config.offsetY}px)`;

      if (props.showSamplingCircles && samplingCanvasRef.current) {
        renderSamplingPoints(
          samplingCanvasRef.current,
          result.samplingData,
          config,
          debugVizOptions,
        );
      }
    };
  }, [
    alphabet,
    metadata,
    props.showSamplingCircles,
    props.showExternalSamplingCircles,
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
      className={s("container", { transparent })}
    >
      <div className={s("content")} ref={contentRef}>
        <pre ref={preRef} className={s("pre")} />
      </div>
      {enableVisualization && <SamplingPointCanvas onCanvasRef={samplingCanvasRef} />}
    </div>
  );
}
