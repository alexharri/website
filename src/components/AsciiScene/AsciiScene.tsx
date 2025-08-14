import React, { useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider, useCanvasContext } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";
import { SplitView, ViewMode } from "../SplitView";

interface AsciiSceneProps {
  children: React.ReactNode;
  height: number;
  showControls?: boolean;
  alphabet?: AlphabetName;
  fontSize?: number;
  showSamplingPoints?: boolean;
  showExternalPoints?: boolean;
}

export const AsciiScene: React.FC<AsciiSceneProps> = (props) => {
  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);

  return (
    <CanvasProvider
      onFrame={(buffer: Uint8Array) => onFrameRef.current?.(buffer)}
      height={props.height}
    >
      <AsciiSceneInner {...props} onFrameRef={onFrameRef} />
    </CanvasProvider>
  );
};

const AsciiSceneInner: React.FC<
  AsciiSceneProps & { onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)> }
> = ({
  children,
  height,
  showControls = true,
  fontSize,
  showSamplingPoints = false,
  showExternalPoints = false,
  onFrameRef,
}) => {
  const { orbitControlsTargetRef } = useCanvasContext();
  const s = useStyles(AsciiSceneStyles);
  const [viewMode, setViewMode] = useState<ViewMode>("left");
  const [splitT, setSplitT] = useState(0.5);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>("default");
  const [characterWidthMultiplier, setCharacterWidthMultiplier] = useState(0.7);
  const [characterHeightMultiplier, setCharacterHeightMultiplier] = useState(1.0);

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
            onFrameRef={onFrameRef}
            alphabet={selectedAlphabet}
            fontSize={fontSize}
            showSamplingPoints={showSamplingPoints}
            showExternalPoints={showExternalPoints}
            characterWidthMultiplier={characterWidthMultiplier}
            characterHeightMultiplier={characterHeightMultiplier}
          />,
          children,
        ]}
      </SplitView>
    </div>
  );
};
