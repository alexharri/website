import React, { useRef, useState, useCallback, useMemo } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAlphabetMetadata } from "../AsciiRenderer/alphabets/AlphabetManager";
import createAsciiSceneStyles from "./AsciiScene.styles";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider, OnFrameOptions } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";
import { ViewModeControl } from "../ViewModeControl";
import { SplitView, ViewMode } from "../SplitView";
import { DebugVizOptions, SamplingPointVisualizationMode } from "../AsciiRenderer/types";
import { NumberVariable } from "../variables";
import { VariableValues, VariableSpec, VariableDict } from "../../types/variables";
import { useSceneHeight } from "../../utils/hooks/useSceneHeight";
import { CharacterSamplingData } from "../AsciiRenderer/ascii/generateAsciiChars";
import { AsciiRenderConfig } from "../AsciiRenderer/renderConfig";
import { useMonospaceCharacterWidthEm } from "../../utils/hooks/useMonospaceCharacterWidthEm";
import { cssVariables } from "../../utils/cssVariables";
import { AsciiDebugVizCanvas } from "../AsciiRenderer/asciiDebugViz";
import { SCENE_BASELINE_WIDTH } from "../../constants";
import { useSamplingDataCollection } from "../../utils/hooks/useSamplingDataCollection";

type ViewModeKey = "ascii" | "split" | "transparent" | "canvas";

interface AsciiSceneProps {
  children: React.ReactNode;
  height: number;
  minWidth?: number;
  showControls?: boolean;
  alphabet?: AlphabetName;
  fontSize?: number;
  lightnessEasingFunction?: string;
  showSamplingCircles?: SamplingPointVisualizationMode | true;
  showExternalSamplingCircles?: boolean;
  showSamplingPoints?: boolean;
  showGrid?: boolean;
  hideAscii?: boolean;
  offsetAlign?: "left" | "center";
  sampleQuality?: number;
  width?: number;
  rowHeight?: number;
  columnWidth?: number;
  characterWidthMultiplier?: number;
  characterHeightMultiplier?: number;
  viewMode?: ViewModeKey;
  viewModes?: ViewModeKey[] | "all";
  pixelate?: boolean;
}

export const AsciiScene: React.FC<AsciiSceneProps> = (props) => {
  const {
    children,
    alphabet: initialAlphabet = "default",
    height: targetHeight,
    showControls = true,
    fontSize: targetFontSize = 14,
    showSamplingCircles = "none",
    showExternalSamplingCircles = false,
    showSamplingPoints = false,
    showGrid = false,
    pixelate = false,
    offsetAlign = "center",
    lightnessEasingFunction,
    viewModes = props.viewMode ? [props.viewMode] : [],
    rowHeight,
    columnWidth,
    width: targetWidth = 1080,
  } = props;
  let { minWidth } = props;

  if (minWidth == null && targetWidth < SCENE_BASELINE_WIDTH) {
    minWidth = targetWidth;
  }

  const VIEW_MODE_MAP: Record<ViewModeKey, { value: ViewMode; label: string }> = {
    ascii: { value: "left", label: pixelate ? "Pixels" : "ASCII" },
    split: { value: "split", label: "Split" },
    transparent: { value: "transparent", label: "Transparent" },
    canvas: { value: "right", label: "Canvas" },
  };

  const hideAscii = props.hideAscii ?? pixelate;

  const availableViewModes =
    viewModes === "all" ? Object.values(VIEW_MODE_MAP) : viewModes.map((key) => VIEW_MODE_MAP[key]);

  const [alphabet, setAlphabet] = useState<AlphabetName>(initialAlphabet);

  const [variables, setVariables] = useState<VariableDict>({});
  const [variableValues, setVariableValues] = useState<VariableValues>({});

  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const cellScale = "cellScale" in variableValues ? (variableValues.cellScale as number) : 1;
  const sampleQuality =
    "sampleQuality" in variableValues
      ? (variableValues.sampleQuality as number)
      : props.sampleQuality ?? 3;
  const heightMultiplierScale = useMemo(() => {
    return (rowHeight ? rowHeight / (targetFontSize * metadata.height) : 1) * cellScale;
  }, [rowHeight, targetFontSize, metadata, cellScale]);
  const widthMultiplierScale = useMemo(() => {
    return (columnWidth ? columnWidth / (targetFontSize * metadata.width) : 1) * cellScale;
  }, [columnWidth, targetFontSize, metadata, cellScale]);

  const orbitControlsTargetRef = useRef<HTMLDivElement>(null);
  const breakpoint = useMemo(() => targetWidth + cssVariables.contentPadding * 2, [targetWidth]);
  const AsciiSceneStyles = useMemo(
    () => createAsciiSceneStyles(targetWidth, breakpoint),
    [targetWidth, breakpoint],
  );
  const s = useStyles(AsciiSceneStyles);
  const onFrameRef = useRef<null | ((buffer: Uint8Array, options?: OnFrameOptions) => void)>(null);
  const samplingDataRef = useRef<CharacterSamplingData[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const characterWidth = useMonospaceCharacterWidthEm(cssVariables.fontMonospace);

  const [viewMode, setViewMode] = useState<ViewMode>(availableViewModes[0]?.value || "left");
  const [splitT, setSplitT] = useState(0.5);
  const [characterWidthMultiplier, setCharacterWidthMultiplier] = useState(
    props.characterWidthMultiplier ?? 1,
  );
  const [characterHeightMultiplier, setCharacterHeightMultiplier] = useState(
    props.characterHeightMultiplier ?? 1,
  );

  const registerSceneVariables = useCallback((variables: VariableDict) => {
    setVariables(variables);
    const initialVariables: VariableValues = {};
    for (const [key, spec] of Object.entries(variables)) {
      initialVariables[key] = spec.value;
    }
    setVariableValues(initialVariables);
  }, []);

  const setVariableValue = useCallback((key: string, value: VariableSpec["value"]) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const debugVizOptions: DebugVizOptions = {
    showSamplingCircles: showSamplingCircles === true ? "raw" : showSamplingCircles,
    showExternalSamplingCircles,
    showSamplingPoints,
    showGrid,
    pixelate,
  };

  const viewportWidth = useViewportWidth();
  let width: number;
  if (viewportWidth == null) {
    width = targetWidth;
  } else if (viewportWidth <= breakpoint) {
    width = viewportWidth;
  } else {
    width = targetWidth;
  }

  const { height, scale } = useSceneHeight(targetHeight, { minWidth });

  const fontSize = targetFontSize * scale * cellScale;

  const config = useMemo(() => {
    if (characterWidth == null) return null; // wait for fonts to load
    return new AsciiRenderConfig(
      width,
      height,
      fontSize,
      characterWidth,
      alphabet,
      sampleQuality,
      characterWidthMultiplier * widthMultiplierScale,
      characterHeightMultiplier * heightMultiplierScale,
      offsetAlign,
    );
  }, [
    width,
    height,
    fontSize,
    characterWidth,
    alphabet,
    sampleQuality,
    characterWidthMultiplier,
    widthMultiplierScale,
    characterHeightMultiplier,
    heightMultiplierScale,
    offsetAlign,
  ]);

  const onFrame = useSamplingDataCollection({
    refs: { canvasRef, samplingDataRef, debugCanvasRef, onFrameRef },
    config,
    debug: { showSamplingPoints, showSamplingCircles, debugVizOptions },
    lightnessEasingFunction,
  });

  return (
    <>
      <div className={s("container")} style={{ height }}>
        {showControls && false && (
          <AsciiSceneControls
            selectedAlphabet={alphabet}
            setSelectedAlphabet={setAlphabet}
            characterWidthMultiplier={characterWidthMultiplier}
            setCharacterWidthMultiplier={setCharacterWidthMultiplier}
            characterHeightMultiplier={characterHeightMultiplier}
            setCharacterHeightMultiplier={setCharacterHeightMultiplier}
          />
        )}
        <CanvasProvider
          onFrame={onFrame}
          height={targetHeight}
          minWidth={minWidth}
          orbitControlsTargetRef={orbitControlsTargetRef}
          registerSceneVariables={registerSceneVariables}
          variables={variableValues}
          canvasRef={canvasRef}
        >
          <SplitView
            viewMode={viewMode}
            height={height}
            width={width}
            splitPosition={splitT}
            onSplitPositionChange={setSplitT}
            wrapperRef={orbitControlsTargetRef}
          >
            {[
              <AsciiRenderer
                key="renderer"
                samplingDataRef={samplingDataRef}
                config={config}
                debugVizOptions={debugVizOptions}
                transparent={viewMode === "transparent"}
                hideAscii={hideAscii}
                showSamplingPoints={showSamplingPoints}
              />,
              children,
            ]}
          </SplitView>
        </CanvasProvider>
        <AsciiDebugVizCanvas onCanvasRef={debugCanvasRef} />
        {viewModes.length > 1 && (
          <div className={s("viewModeControl")}>
            <ViewModeControl
              viewMode={viewMode}
              setViewMode={setViewMode}
              setSplitT={setSplitT}
              options={availableViewModes}
            />
          </div>
        )}
      </div>

      {showControls && Object.keys(variables).length > 0 && (
        <div className={s("variablesWrapper")}>
          {Object.entries(variables).map(([key, spec]) => {
            const value = variableValues[key];
            if (spec.type === "number") {
              return (
                <NumberVariable
                  key={key}
                  dataKey={key}
                  value={value as number}
                  onValueChange={(value) => setVariableValue(key, value)}
                  spec={spec}
                />
              );
            }
            throw new Error(`Variable rendering not implemented for type ${spec.type}`);
          })}
        </div>
      )}
    </>
  );
};
