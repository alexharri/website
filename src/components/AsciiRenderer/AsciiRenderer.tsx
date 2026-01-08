import { useEffect, useMemo, useRef, useCallback } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { CharacterSamplingData, samplingDataToAscii } from "./ascii/generateAsciiChars";
import { useStyles } from "../../utils/styles";
import { colors } from "../../utils/cssVariables";
import { PixelatedCanvas, renderPixelatedCanvas } from "./PixelatedCanvas";
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
    config,
    characterMode,
    optimizePerformance,
  } = props;

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

  const updateAsciiText = useCallback(
    (samplingData: CharacterSamplingData[][]) => {
      if (!config || !characterMatcher || samplingData.length === 0) return;

      if (!hideAscii) {
        if (optimizePerformance) {
          asciiCanvas.render(samplingData, characterMatcher);
        } else if (preRef.current) {
          const ascii = samplingDataToAscii(characterMatcher, samplingData, config);
          preRef.current.textContent = ascii;
        }
      }

      if (pixelateCanvasRef.current && debugVizOptions.pixelate) {
        renderPixelatedCanvas(pixelateCanvasRef.current, samplingData, config);
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
  if (transparent && hideAscii) {
    background = "transparent";
  } else if (transparent) {
    background = hexToRgbaString(colors.background200, 0.7);
  } else {
    background = colors.background200;
  }

  return (
    <div style={{ background }} className={s("container")}>
      {!hideAscii && (
        <div
          className={s("content")}
          style={{
            transform: config
              ? `translate(${config.offsetX + config.asciiXOffset}px, ${config.offsetY}px)`
              : undefined,
          }}
        >
          {optimizePerformance ? (
            <AsciiCanvas canvasRef={asciiCanvasRef} transparent={transparent} />
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
        <PixelatedCanvas canvasRef={pixelateCanvasRef} transparent={transparent} />
      )}
    </div>
  );
}
