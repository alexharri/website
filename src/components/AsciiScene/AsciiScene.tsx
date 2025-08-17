import React, { useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";
import { SplitView, ViewMode } from "../SplitView";
import { DebugVizOptions, SamplingPointVisualizationMode } from "../AsciiRenderer/types";

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
}

export const AsciiScene: React.FC<AsciiSceneProps> = ({
  children,
  height,
  showControls = true,
  fontSize,
  showSamplingCircles = "none",
  showExternalSamplingCircles = false,
  showSamplingPoints = false,
  lightnessEasingFunction,
}) => {
  const orbitControlsTargetRef = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiSceneStyles);
  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("left");
  const [splitT, setSplitT] = useState(0.5);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>("default");
  const [characterWidthMultiplier, setCharacterWidthMultiplier] = useState(0.7);
  const [characterHeightMultiplier, setCharacterHeightMultiplier] = useState(1.0);

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

  return (
    <CanvasProvider
      onFrame={(buffer: Uint8Array) => onFrameRef.current?.(buffer)}
      height={height}
      orbitControlsTargetRef={orbitControlsTargetRef}
    >
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
      </div>
    </CanvasProvider>
  );
};
