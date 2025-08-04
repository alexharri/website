import React, { useRef, useState, useContext } from "react";
import { Scene } from "../../threejs/scenes";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles, { BREAKPOINT, CONTENT_WIDTH } from "./AsciiScene.styles";
import { useSceneHeight } from "../../threejs/hooks";
import { clamp } from "../../math/math";
import { useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { ThreeContext } from "../../threejs/Components/ThreeProvider";

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
}) => {
  const THREE = useContext(ThreeContext);
  const s = useStyles(AsciiSceneStyles);
  const [split, setSplit] = useState(false);
  const [splitT, setSplitT] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>("default");
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());

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
    if (split) {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && split) {
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
          <span className={s("label")}>Split:</span>
          <button
            className={s("button", { active: split })}
            onClick={() => {
              setSplit(!split);
              setSplitT(0.5);
            }}
          >
            {split ? "ON" : "OFF"}
          </button>

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
          className={s("border", { dragging: isDragging, split })}
          style={{
            transform: split
              ? `translateX(calc(${splitT * width}px - ${width / 2}px - 50%))`
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
              transform: split ? `translateX(calc(-${width * (1 - splitT)}px))` : "translateX(0)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            <div
              className={s("asciiInner")}
              style={{
                transform: split
                  ? `translateX(calc(${-splitPercentage / 2}% + 50%))`
                  : "translateX(0)",
                transition: isDragging ? "none" : "all 0.5s",
              }}
            >
              <AsciiRenderer
                onFrameRef={onFrameRef}
                canvasRef={canvasRef}
                alphabet={selectedAlphabet}
              />
            </div>
          </div>
          <div
            data-canvas-container
            className={s("canvas", { split })}
            style={{
              height,
              transform: split ? `translateX(${width * splitT}px)` : "translateX(100%)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            <div
              className={s("canvasInner", { split })}
              style={{
                transform: split
                  ? `translateX(calc(-${50 + splitPercentage / 2}%))`
                  : "translateX(-75%)",
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
