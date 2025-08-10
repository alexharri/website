import React, { useRef, useState } from "react";
import { Scene } from "../../threejs/scenes";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { useSceneHeight } from "../../threejs/hooks";
import { clamp } from "../../math/math";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { SegmentedControl } from "../SegmentedControl";

interface AsciiSceneProps {
  scene: string;
  height: number;
  angle?: number;
  autoRotate?: boolean;
  usesVariables?: boolean;
  zoom?: number;
  yOffset?: number;
  xRotation?: number;
  showControls?: boolean;
  alphabet?: AlphabetName;
  fontSize?: number;
  showSamplingPoints?: boolean;
  showExternalPoints?: boolean;
}

export const AsciiScene: React.FC<AsciiSceneProps> = ({
  scene,
  height: targetHeight,
  angle,
  autoRotate,
  usesVariables,
  zoom,
  yOffset,
  xRotation,
  showControls = true,
  fontSize,
  showSamplingPoints = false,
  showExternalPoints = false,
}) => {
  const s = useStyles(AsciiSceneStyles);
  const [viewMode, setViewMode] = useState<"ascii" | "split" | "canvas">("ascii");
  const [splitT, setSplitT] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>("default");
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());
  const [characterWidthPx, setCharacterWidthPx] = useState(10);

  const viewportWidth = useViewportWidth();
  let width: number;
  if (viewportWidth == null) {
    width = CONTENT_WIDTH;
  } else if (viewportWidth < BREAKPOINT) {
    width = viewportWidth;
  } else {
    width = CONTENT_WIDTH;
  }

  const handleAlphabetChange = (newAlphabet: AlphabetName) => {
    setSelectedAlphabet(newAlphabet);
  };

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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);
  const orbitControlsTargetRef = useRef<HTMLDivElement>(null);

  const { height } = useSceneHeight(targetHeight);

  const sceneProps = {
    scene,
    height: targetHeight,
    angle,
    autoRotate,
    usesVariables,
    zoom,
    yOffset,
    xRotation,
    canvasRef,
    onFrame: (buffer: Uint8Array) => onFrameRef.current?.(buffer),
    orbitControlsTargetRef,
  };

  const splitPercentage = splitT * 100;

  return (
    <div className={s("container")}>
      {showControls && (
        <div className={s("controls")}>
          <span className={s("label")}>View:</span>
          <SegmentedControl
            options={[
              { value: "ascii", label: "ASCII" },
              { value: "split", label: "Split" },
              { value: "canvas", label: "Canvas" },
            ]}
            value={viewMode}
            setValue={(value) => {
              setViewMode(value);
              if (value === "split") {
                setSplitT(0.5);
              }
            }}
          />

          <span className={s("label")}>Alphabet:</span>
          <select
            className={s("select")}
            value={selectedAlphabet}
            onChange={(e) => handleAlphabetChange(e.target.value as AlphabetName)}
          >
            {availableAlphabets.map((alphabetOption) => (
              <option key={alphabetOption} value={alphabetOption}>
                {alphabetOption.charAt(0).toUpperCase() + alphabetOption.slice(1)}
              </option>
            ))}
          </select>

          <div className={s("sliderGroup")}>
            <span className={s("label")}>Character Width:</span>
            <div className={s("sliderContainer")}>
              <button
                className={s("sliderButton")}
                onClick={() => setCharacterWidthPx(Math.max(2, characterWidthPx - 1))}
                disabled={characterWidthPx <= 2}
              >
                −
              </button>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={characterWidthPx}
                onChange={(e) => setCharacterWidthPx(Number(e.target.value))}
                className={s("slider")}
              />
              <button
                className={s("sliderButton")}
                onClick={() => setCharacterWidthPx(Math.min(30, characterWidthPx + 1))}
                disabled={characterWidthPx >= 30}
              >
                +
              </button>
              <span className={s("sliderValue")}>{characterWidthPx}px</span>
            </div>
          </div>
        </div>
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
                canvasRef={canvasRef}
                alphabet={selectedAlphabet}
                fontSize={fontSize}
                showSamplingPoints={showSamplingPoints}
                showExternalPoints={showExternalPoints}
                characterWidthPx={characterWidthPx}
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
                    ? `translateX(calc(-${50 + splitPercentage / 2}%))`
                    : "translateX(-50%)",
                transition: isDragging ? "none" : "all 0.5s",
              }}
            >
              <Scene {...sceneProps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
