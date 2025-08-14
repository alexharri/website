import React, { useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { clamp } from "../../math/math";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { CanvasProvider, useCanvasContext } from "../../contexts/CanvasContext";
import { AsciiSceneControls } from "./AsciiSceneControls";

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
  const [viewMode, setViewMode] = useState<"ascii" | "split" | "canvas">("ascii");
  const [splitT, setSplitT] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
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


  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === "split") {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === "split") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSplitT(clamp(x / rect.width, 0.2, 0.8));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const splitPercentage = splitT * 100;

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
      <div
        className={s("wrapper")}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: "grab" }}
      >
        <div
          className={s("border", { dragging: isDragging, split: viewMode === "split" })}
          style={{
            transform:
              viewMode === "split"
                ? `translateX(calc(${splitT * width}px - ${width / 2}px - 50%))`
                : viewMode === "canvas"
                ? `translateX(calc(-${width / 2}px - 100%))`
                : `translateX(${width / 2}px)`,
            transition: isDragging ? "none" : "all 0.5s",
          }}
          onMouseDown={handleMouseDown}
        >
          <div data-handle />
        </div>

        <div ref={orbitControlsTargetRef}>
          <div
            data-ascii-container
            className={s("ascii")}
            style={{
              transform:
                viewMode === "split"
                  ? `translateX(calc(-${width * (1 - splitT)}px))`
                  : viewMode === "canvas"
                  ? "translateX(-100%)"
                  : "translateX(0)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            <div
              className={s("asciiInner")}
              style={{
                transform:
                  viewMode === "split"
                    ? `translateX(calc(${-splitPercentage / 2}% + 50%))`
                    : viewMode === "canvas"
                    ? "translateX(100%)"
                    : "translateX(0)",
                transition: isDragging ? "none" : "all 0.5s",
              }}
            >
              <AsciiRenderer
                onFrameRef={onFrameRef}
                alphabet={selectedAlphabet}
                fontSize={fontSize}
                showSamplingPoints={showSamplingPoints}
                showExternalPoints={showExternalPoints}
                characterWidthMultiplier={characterWidthMultiplier}
                characterHeightMultiplier={characterHeightMultiplier}
              />
            </div>
          </div>
          <div
            data-canvas-container
            className={s("canvas", { split: viewMode === "split" })}
            style={{
              height,
              transform: viewMode === "split" ? `translateX(${width * splitT}px)` : "translateX(0)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            <div
              className={s("canvasInner", { split: viewMode === "split" })}
              style={{
                transform:
                  viewMode === "split"
                    ? `translateX(calc(-${50 + (splitT * 100) / 2}%))`
                    : "translateX(-50%)",
                transition: isDragging ? "none" : "all 0.5s",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
