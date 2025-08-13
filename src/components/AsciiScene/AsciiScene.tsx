import React, { useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { clamp } from "../../math/math";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { SegmentedControl } from "../SegmentedControl";
import { CanvasProvider, useCanvasContext } from "../../contexts/CanvasContext";

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
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());
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

  const splitPercentage = splitT * 100;

  return (
    <div className={s("container")} style={{ height }}>
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
                onClick={() =>
                  setCharacterWidthMultiplier(Math.max(0.1, characterWidthMultiplier - 0.05))
                }
                disabled={characterWidthMultiplier <= 0.1}
              >
                −
              </button>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={characterWidthMultiplier}
                onChange={(e) => setCharacterWidthMultiplier(Number(e.target.value))}
                className={s("slider")}
              />
              <button
                className={s("sliderButton")}
                onClick={() =>
                  setCharacterWidthMultiplier(Math.min(2.0, characterWidthMultiplier + 0.05))
                }
                disabled={characterWidthMultiplier >= 2.0}
              >
                +
              </button>
              <span className={s("sliderValue")}>{characterWidthMultiplier.toFixed(2)}×</span>
            </div>
          </div>

          <div className={s("sliderGroup")}>
            <span className={s("label")}>Character Height:</span>
            <div className={s("sliderContainer")}>
              <button
                className={s("sliderButton")}
                onClick={() =>
                  setCharacterHeightMultiplier(Math.max(0.3, characterHeightMultiplier - 0.05))
                }
                disabled={characterHeightMultiplier <= 0.3}
              >
                −
              </button>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.05"
                value={characterHeightMultiplier}
                onChange={(e) => setCharacterHeightMultiplier(Number(e.target.value))}
                className={s("slider")}
              />
              <button
                className={s("sliderButton")}
                onClick={() =>
                  setCharacterHeightMultiplier(Math.min(3.0, characterHeightMultiplier + 0.05))
                }
                disabled={characterHeightMultiplier >= 3.0}
              >
                +
              </button>
              <span className={s("sliderValue")}>{characterHeightMultiplier.toFixed(2)}×</span>
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
