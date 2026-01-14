import { useEffect, useMemo, useRef, useCallback } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { CharacterSamplingData } from "../sampling/types";
import { useStyles } from "../../../utils/styles";
import { colors } from "../../../utils/cssVariables";
import { PixelatedCanvas, renderPixelatedCanvas } from "./PixelatedCanvas";
import { AsciiCanvas, useAsciiCanvas } from "./AsciiCanvas";
import { CharacterMatcher } from "../characterLookup/CharacterMatcher";

import { AsciiRenderConfig } from "../renderConfig";
import { DebugVizOptions } from "../types";
import { hexToRgbaString } from "../../../utils/color";
import { Observer } from "../../../utils/observer";
import { EFFECTS } from "../effects";

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
  const { showSamplingCircles, showSamplingPoints } = debugVizOptions;

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
  if (showSamplingCircles || showSamplingPoints) {
    background = hexToRgbaString(colors.background200, 0.7);
  } else if (transparent && hideAscii) {
    background = "transparent";
  } else if (transparent) {
    background = hexToRgbaString(colors.background200, 0.7);
  } else {
    background = colors.background200;
  }

  const offsetTransform = config
    ? `translate(${config.offsetX + config.asciiXOffset}px, ${config.offsetY}px)`
    : undefined;

  return (
    <div style={{ background }} className={s("container")}>
      {!hideAscii && (
        <>
          {optimizePerformance ? (
            <AsciiCanvas canvasRef={asciiCanvasRef} transform={offsetTransform} />
          ) : (
            <pre
              ref={preRef}
              className={s("pre")}
              style={{
                color,
                letterSpacing: config ? config.letterSpacingEm + "em" : undefined,
                lineHeight: config ? config.lineHeight.toString() : undefined,
                fontSize: config ? config.fontSize + "px" : undefined,
                transform: offsetTransform,
              }}
            />
          )}
        </>
      )}
      {debugVizOptions.pixelate && (
        <PixelatedCanvas canvasRef={pixelateCanvasRef} transparent={transparent} />
      )}
    </div>
  );
}

function samplingDataToAscii(
  matcher: CharacterMatcher,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
): string {
  const chars: string[] = [];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const cellSamplingData = samplingData[row]?.[col];
      if (!cellSamplingData) {
        chars.push(" ");
        continue;
      }

      const selectedChar =
        cellSamplingData.character ||
        matcher.findBestCharacterQuantized(cellSamplingData.samplingVector);
      chars.push(selectedChar);
    }
    chars.push("\n");
  }

  return chars.join("");
}
