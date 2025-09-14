import { useEffect, useMemo, useRef } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars } from "./ascii/generateAsciiChars";
import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";
import { useSceneContext } from "../../contexts/CanvasContext";
import { colors, cssVariables } from "../../utils/cssVariables";
import { useMonospaceCharacterWidthEm } from "../../utils/hooks/useMonospaceCharacterWidthEm";
import { AsciiDebugVizCanvas, renderAsciiDebugViz } from "./asciiDebugViz";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { EFFECTS } from "./ascii/effects";
import { AsciiRenderConfig } from "./renderConfig";
import { DebugVizOptions } from "./types";
import { hexToRgbaString } from "../../utils/color";

interface Props {
  alphabet: AlphabetName;
  onFrameRef: React.MutableRefObject<
    null | ((buffer: Uint8Array, options?: { flipY?: boolean }) => void)
  >;
  fontSize: number;
  characterWidthMultiplier: number;
  characterHeightMultiplier: number;
  lightnessEasingFunction?: string;
  transparent: boolean;
  hideAscii: boolean;
  showSamplingPoints: boolean;
  offsetAlign: "left" | "center";
  debugVizOptions: DebugVizOptions;
  sampleQuality: number;
}

export function AsciiRenderer(props: Props) {
  const {
    alphabet,
    fontSize,
    characterHeightMultiplier,
    characterWidthMultiplier,
    debugVizOptions,
    transparent,
    hideAscii,
    showSamplingPoints,
    offsetAlign,
    sampleQuality,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const preRef = useRef<HTMLPreElement>(null);
  const samplingCanvasRef = useRef<HTMLCanvasElement>(null);
  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const characterWidth = useMonospaceCharacterWidthEm(cssVariables.fontMonospace);

  const context = useSceneContext();
  if (!context) {
    throw new Error(`AsciiRenderer requires a CanvasContext`);
  }

  const characterMatcher = useMemo(() => {
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet(alphabet, [EFFECTS.componentWiseGlobalNormalization]);
    return matcher;
  }, [alphabet]);

  useEffect(() => {
    props.onFrameRef.current = function onFrame(
      pixelBuffer: Uint8Array,
      options: { flipY?: boolean } = {},
    ): void {
      const flipY = options.flipY ?? false;
      const container = containerRef.current;
      const content = contentRef.current;
      const preEl = preRef.current;
      if (!container || characterWidth == null) return;

      const canvas = context.canvasRef.current;
      if (!canvas) return;

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;

      const pixelBufferScale = canvas.width / containerRect.width;

      const config = new AsciiRenderConfig(
        containerRect.width,
        containerRect.height,
        fontSize,
        characterWidth,
        alphabet,
        sampleQuality,
        characterWidthMultiplier,
        characterHeightMultiplier,
        offsetAlign,
      );

      const result = generateAsciiChars(
        characterMatcher,
        pixelBuffer,
        pixelBufferScale,
        config,
        debugVizOptions.showSamplingPoints,
        flipY,
        debugVizOptions.showSamplingCircles,
        props.lightnessEasingFunction,
      );

      if (preEl) {
        preEl.textContent = result.ascii;
        preEl.style.letterSpacing = config.letterSpacingEm + "em";
        preEl.style.lineHeight = config.lineHeight.toString();
        preEl.style.fontSize = config.fontSize + "px";
      }
      if (content) {
        content.style.transform = `translate(${config.offsetX + config.asciiXOffset}px, ${
          config.offsetY
        }px)`;
      }

      if (samplingCanvasRef.current) {
        renderAsciiDebugViz(
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
    debugVizOptions,
    fontSize,
    characterWidthMultiplier,
    characterHeightMultiplier,
    characterWidth,
    hideAscii,
  ]);

  let background: string;
  if (showSamplingPoints) {
    background = hexToRgbaString(colors.background200, 0.5);
  } else if (transparent && hideAscii) {
    background = "transparent";
  } else if (transparent) {
    background = hexToRgbaString(colors.background200, 0.5);
  } else {
    background = colors.background200;
  }

  return (
    <div
      data-ascii
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background }}
      className={s("container")}
    >
      {!hideAscii && (
        <div className={s("content")} ref={contentRef}>
          <pre
            ref={preRef}
            className={s("pre")}
            style={{ color: transparent ? colors.text : colors.blue400 }}
          />
        </div>
      )}
      <AsciiDebugVizCanvas onCanvasRef={samplingCanvasRef} />
    </div>
  );
}
