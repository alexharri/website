import React, { useRef, useState, useCallback, useMemo } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAlphabetMetadata } from "../AsciiRenderer/alphabets/AlphabetManager";
import createAsciiSceneStyles from "./AsciiScene.styles";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";
import { ViewModeControl } from "../ViewModeControl";
import { SplitView, ViewMode } from "../SplitView";
import { DebugVizOptions, SamplingPointVisualizationMode } from "../AsciiRenderer/types";
import { NumberVariable } from "../variables";
import { VariableValues, VariableSpec, VariableDict } from "../../types/variables";
import { useSceneHeight } from "../../utils/hooks/useSceneHeight";

type ViewModeKey = "ascii" | "split" | "transparent" | "canvas";

interface AsciiSceneProps {
  children: React.ReactNode;
  height: number;
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
  width?: number;
  rowHeight?: number;
  columnWidth?: number;
  characterWidthMultiplier?: number;
  characterHeightMultiplier?: number;
  viewMode?: ViewModeKey;
  viewModes?: ViewModeKey[] | "all";
}

const VIEW_MODE_MAP: Record<ViewModeKey, { value: ViewMode; label: string }> = {
  ascii: { value: "left", label: "ASCII" },
  split: { value: "split", label: "Split" },
  transparent: { value: "transparent", label: "Transparent" },
  canvas: { value: "right", label: "Canvas" },
};

export const AsciiScene: React.FC<AsciiSceneProps> = (props) => {
  const {
    children,
    height: targetHeight,
    showControls = false,
    fontSize: targetFontSize = 14,
    showSamplingCircles = "none",
    showExternalSamplingCircles = false,
    showSamplingPoints = false,
    showGrid = false,
    hideAscii = false,
    offsetAlign = "center",
    lightnessEasingFunction,
    viewModes = props.viewMode ? [props.viewMode] : [],
    rowHeight,
    columnWidth,
    width: targetWidth = 1080,
  } = props;

  const availableViewModes =
    viewModes === "all" ? Object.values(VIEW_MODE_MAP) : viewModes.map((key) => VIEW_MODE_MAP[key]);

  const [alphabet, setAlphabet] = useState<AlphabetName>("default");

  const metadata = useMemo(() => getAlphabetMetadata(alphabet), [alphabet]);
  const heightMultiplierScale = useMemo(() => {
    return rowHeight ? rowHeight / (targetFontSize * metadata.height) : 1;
  }, [rowHeight, targetFontSize, metadata]);
  const widthMultiplierScale = useMemo(() => {
    return columnWidth ? columnWidth / (targetFontSize * metadata.width) : 1;
  }, [columnWidth, targetFontSize, metadata]);

  const orbitControlsTargetRef = useRef<HTMLDivElement>(null);
  const breakpoint = useMemo(() => targetWidth + 80, [targetWidth]);
  const AsciiSceneStyles = useMemo(
    () => createAsciiSceneStyles(targetWidth, breakpoint),
    [targetWidth, breakpoint],
  );
  const s = useStyles(AsciiSceneStyles);
  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(availableViewModes[0]?.value || "left");
  const [splitT, setSplitT] = useState(0.5);
  const [characterWidthMultiplier, setCharacterWidthMultiplier] = useState(
    props.characterWidthMultiplier ?? 1,
  );
  const [characterHeightMultiplier, setCharacterHeightMultiplier] = useState(
    props.characterHeightMultiplier ?? 1,
  );

  const [variables, setVariables] = useState<VariableDict>({});
  const [variableValues, setVariableValues] = useState<VariableValues>({});

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
  };

  const viewportWidth = useViewportWidth();
  let width: number;
  if (viewportWidth == null) {
    width = targetWidth;
  } else if (viewportWidth < breakpoint) {
    width = viewportWidth;
  } else {
    width = targetWidth;
  }

  const { height, scale } = useSceneHeight(targetHeight);

  const fontSize = targetFontSize * scale;

  const onFrame = useCallback((buffer: Uint8Array) => onFrameRef.current?.(buffer), []);

  return (
    <>
      <div className={s("container")} style={{ height }}>
        {showControls && (
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
          orbitControlsTargetRef={orbitControlsTargetRef}
          registerSceneVariables={registerSceneVariables}
          variables={variableValues}
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
                onFrameRef={onFrameRef}
                alphabet={alphabet}
                fontSize={fontSize}
                characterWidthMultiplier={characterWidthMultiplier * widthMultiplierScale}
                characterHeightMultiplier={characterHeightMultiplier * heightMultiplierScale}
                lightnessEasingFunction={lightnessEasingFunction}
                debugVizOptions={debugVizOptions}
                transparent={viewMode === "transparent"}
                hideAscii={hideAscii}
                offsetAlign={offsetAlign}
              />,
              children,
            ]}
          </SplitView>
        </CanvasProvider>
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

      {Object.keys(variables).length > 0 && (
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
                  showValue={false}
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
