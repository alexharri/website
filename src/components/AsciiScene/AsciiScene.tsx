import React, { useRef, useState } from "react";
import { Scene } from "../../threejs/scenes";
import { useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneStyles from "./AsciiScene.styles";
import { useSceneHeight } from "../../threejs/hooks";

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
  alphabet = "default",
}) => {
  const s = useStyles(AsciiSceneStyles);
  const [split, setSplit] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>(alphabet);
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());

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
      const percentage = Math.min(90, Math.max(10, (x / rect.width) * 100));
      setSplitPosition(percentage);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFrameRef = useRef<null | ((buffer: Uint8Array) => void)>(null);

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
    ascii: false, // Scene component no longer handles ASCII rendering
    canvasRef: canvasRef,
    onFrame: (buffer: Uint8Array) => onFrameRef.current?.(buffer),
  };

  return (
    <div className={s("container")}>
      {showControls && (
        <div className={s("controls")}>
          <span className={s("label")}>Split:</span>
          <button className={s("button", { active: split })} onClick={() => setSplit(!split)}>
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
      >
        <div
          className={s("border", { dragging: isDragging, split })}
          style={{
            transform: split
              ? `translateX(calc(${splitPosition}vw - 50vw - 50%))`
              : "translateX(50vw)",
            transition: isDragging ? "none" : "all 0.5s",
          }}
          onMouseDown={handleMouseDown}
        >
          <div data-handle />
        </div>
        <div
          data-ascii-container
          className={s("ascii")}
          style={{
            transform: split ? `translateX(calc(-${100 - splitPosition}vw))` : "translateX(0)",
            transition: isDragging ? "none" : "all 0.5s",
          }}
        >
          <div
            className={s("asciiInner")}
            style={{
              transform: split ? `translateX(calc(${-splitPosition / 2}% + 50%))` : "translateX(0)",
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
            transform: split ? `translateX(${splitPosition}vw)` : "translateX(100%)",
            transition: isDragging ? "none" : "all 0.5s",
          }}
        >
          <div
            className={s("canvasInner", { split })}
            style={{
              transform: split
                ? `translateX(calc(-${50 + splitPosition / 2}%))`
                : "translateX(-75%)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            <Scene {...sceneProps} />
          </div>
        </div>
      </div>
    </div>
  );
};
