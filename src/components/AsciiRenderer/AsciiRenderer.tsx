import { useEffect, useMemo, useRef, useCallback } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { useStyles } from "../../utils/styles";
import { colors } from "../../utils/cssVariables";
import { PixelateCanvas, renderPixelate } from "./PixelateCanvas";
import { AsciiCanvas, renderAsciiCanvas } from "./AsciiCanvas";
import { CharacterMatcher } from "./ascii/CharacterMatcher";
import { EFFECTS } from "./ascii/effects";
import { AsciiRenderConfig } from "./renderConfig";
import { DebugVizOptions } from "./types";
import { hexToRgbaString } from "../../utils/color";

interface Props {
  samplingDataRef: React.MutableRefObject<CharacterSamplingData[][]>;
  config: AsciiRenderConfig | null;
  transparent: boolean;
  hideAscii: boolean;
  showSamplingCircles: boolean;
  showSamplingPoints: boolean;
  debugVizOptions: DebugVizOptions;
  characterMode: boolean;
}

export function AsciiRenderer(props: Props) {
  const {
    debugVizOptions,
    transparent,
    hideAscii,
    showSamplingCircles,
    showSamplingPoints,
    samplingDataRef,
    config,
    characterMode,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);
  const asciiCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelateCanvasRef = useRef<HTMLCanvasElement>(null);

  const characterMatcher = useMemo(() => {
    if (!config) return null;
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet(
      config.alphabet,
      characterMode ? [] : [EFFECTS.componentWiseGlobalNormalization],
    );
    return matcher;
  }, [config?.alphabet]);

  useEffect(() => {
    const content = contentRef.current;
    if (!config || !content) return;
    content.style.transform = `translate(${config.offsetX + config.asciiXOffset}px, ${
      config.offsetY
    }px)`;
  }, [config]);

  const updateAsciiText = useCallback(() => {
    const asciiCanvas = asciiCanvasRef.current;
    const samplingData = samplingDataRef.current;

    if (!config || !characterMatcher || samplingData.length === 0) return;

    if (!hideAscii && asciiCanvas) {
      const color = transparent ? colors.text : colors.blue400;
      renderAsciiCanvas(asciiCanvas, samplingData, config, characterMatcher, color);
    }

    if (pixelateCanvasRef.current && debugVizOptions.pixelate) {
      renderPixelate(pixelateCanvasRef.current, samplingData, config);
    }
  }, [characterMatcher, debugVizOptions.pixelate, config, hideAscii, transparent]);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) return;
      updateAsciiText();
      requestAnimationFrame(tick);
    };

    tick();

    return () => {
      mounted = false;
    };
  }, [updateAsciiText]);

  let background: string;
  if (showSamplingCircles || showSamplingPoints) {
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
          <AsciiCanvas onCanvasRef={asciiCanvasRef} transparent={transparent} />
        </div>
      )}
      {debugVizOptions.pixelate && (
        <PixelateCanvas onCanvasRef={pixelateCanvasRef} transparent={transparent} />
      )}
    </div>
  );
}
