import React, { useRef, useState, useCallback } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";
import { SplitView, ViewMode } from "../SplitView";
import { DebugVizOptions, SamplingPointVisualizationMode } from "../AsciiRenderer/types";
import { NumberVariable } from "../variables";
import { VariableValues, VariableSpec, VariableDict } from "../../types/variables";
import { useSceneHeight } from "../../utils/hooks/useSceneHeight";

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
  characterWidthMultiplier?: number;
  characterHeightMultiplier?: number;
}

export const AsciiScene: React.FC<AsciiSceneProps> = (props) => {
  const {
    children,
    height: targetHeight,
    showControls = true,
    fontSize: targetFontSize = 14,
    showSamplingCircles = "none",
    showExternalSamplingCircles = false,
    showSamplingPoints = false,
    lightnessEasingFunction,
  } = props;
  const orbitControlsTargetRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiSceneStyles);
  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("left");
  const [splitT, setSplitT] = useState(0.5);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>("default");
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
  };

  const viewportWidth = useViewportWidth();
  let width: number;
  if (viewportWidth == null) {
    width = CONTENT_WIDTH;
  } else if (viewportWidth < BREAKPOINT) {
    width = viewportWidth;
  } else {
    width = CONTENT_WIDTH;
  }

  const { height, scale } = useSceneHeight(targetHeight);

  const fontSize = targetFontSize * scale;

  const onFrame = useCallback((buffer: Uint8Array) => onFrameRef.current?.(buffer), []);

  return (
    <>
      <div className={s("container")} style={{ height }}>
        {showControls && (
          <AsciiSceneControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            setSplitT={setSplitT}
            selectedAlphabet={selectedAlphabet}
            setSelectedAlphabet={setSelectedAlphabet}
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
                alphabet={selectedAlphabet}
                fontSize={fontSize}
                characterWidthMultiplier={characterWidthMultiplier}
                characterHeightMultiplier={characterHeightMultiplier}
                lightnessEasingFunction={lightnessEasingFunction}
                debugVizOptions={debugVizOptions}
                transparent={viewMode === "transparent"}
              />,
              children,
            ]}
          </SplitView>
        </CanvasProvider>
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
