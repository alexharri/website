import { useEffect, useMemo, useRef, useCallback } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { CharacterSamplingData, samplingDataToAscii } from "./ascii/generateAsciiChars";
import { useStyles } from "../../utils/styles";
import { colors } from "../../utils/cssVariables";
import { PixelateCanvas, renderPixelate } from "./PixelateCanvas";
import { AsciiCanvas, useAsciiCanvas } from "./AsciiCanvas";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { EFFECTS } from "./ascii/effects";
import { AsciiRenderConfig } from "./renderConfig";
import { DebugVizOptions } from "./types";
import { hexToRgbaString } from "../../utils/color";
import { Observer } from "../../utils/observer";

interface Props {
  samplingDataObserver: Observer<CharacterSamplingData[][]>;
  config: AsciiRenderConfig | null;
  transparent: boolean;
  hideAscii: boolean;
  showSamplingCircles: boolean;
  showSamplingPoints: boolean;
  debugVizOptions: DebugVizOptions;
  characterMode: boolean;
  optimizePerformance: boolean;
}

export function AsciiRenderer(props: Props) {
  const {
    samplingDataObserver,
    debugVizOptions,
    transparent,
    hideAscii,
    showSamplingCircles,
    showSamplingPoints,
    config,
    characterMode,
    optimizePerformance,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const asciiCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelateCanvasRef = useRef<HTMLCanvasElement>(null);

  const characterMatcher = useMemo(() => {
    if (!config) return null;
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet(
      config.alphabet,
      characterMode ? [] : [EFFECTS.componentWiseGlobalNormalization],
      config.exclude,
    );
    return matcher;
  }, [config?.alphabet]);

  const color = transparent ? colors.text : colors.blue;
  const asciiCanvas = useAsciiCanvas(asciiCanvasRef, config, color);

  useEffect(() => {
    const content = contentRef.current;
    if (!config || !content) return;
    content.style.transform = `translate(${config.offsetX + config.asciiXOffset}px, ${
      config.offsetY
    }px)`;
  }, [config]);

  const updateAsciiText = useCallback(
    (samplingData: CharacterSamplingData[][]) => {
      const preEl = preRef.current;

      if (!config || !characterMatcher || samplingData.length === 0) return;

      if (optimizePerformance) {
        if (!hideAscii) {
          asciiCanvas.render(samplingData, characterMatcher);
        }
      } else {
        if (!hideAscii && preEl) {
          const ascii = samplingDataToAscii(characterMatcher, samplingData, config);
          preEl.textContent = ascii;
        }
      }

      if (pixelateCanvasRef.current && debugVizOptions.pixelate) {
        renderPixelate(pixelateCanvasRef.current, samplingData, config);
      }
    },
    [
      characterMatcher,
      debugVizOptions.pixelate,
      config,
      hideAscii,
      optimizePerformance,
      asciiCanvas,
    ],
  );

  useEffect(() => {
    updateAsciiText(samplingDataObserver.getValue());
    const unsubscribe = samplingDataObserver.subscribe(updateAsciiText);
    return unsubscribe;
  }, [updateAsciiText]);

  let background: string;
  if (showSamplingCircles || showSamplingPoints) {
    background = hexToRgbaString(colors.background200, 0.7);
  } else if (transparent && hideAscii) {
    background = "transparent";
  } else if (transparent) {
    background = hexToRgbaString(colors.background200, 0.7);
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
          {optimizePerformance ? (
            <AsciiCanvas onCanvasRef={asciiCanvasRef} transparent={transparent} />
          ) : (
            <pre
              ref={preRef}
              className={s("pre")}
              style={{
                color,
                letterSpacing: config ? config.letterSpacingEm + "em" : undefined,
                lineHeight: config ? config.lineHeight.toString() : undefined,
                fontSize: config ? config.fontSize + "px" : undefined,
              }}
            />
          )}
        </div>
      )}
      {debugVizOptions.pixelate && (
        <PixelateCanvas onCanvasRef={pixelateCanvasRef} transparent={transparent} />
      )}
    </div>
  );
}
