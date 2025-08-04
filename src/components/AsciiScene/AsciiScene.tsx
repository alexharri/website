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
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>(alphabet);
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());

  const handleAlphabetChange = (newAlphabet: AlphabetName) => {
    setSelectedAlphabet(newAlphabet);
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

          {split && (
            <>
              <span className={s("label")}>Position:</span>
              <input
                type="range"
                min="10"
                max="90"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className={s("slider")}
              />
              <span className={s("sliderValue")}>{splitPosition}%</span>
            </>
          )}

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

      <div className={s("wrapper")}>
        <div
          className={s("border")}
          style={{
            transform: split
              ? `translateX(calc(${splitPosition}vw - 50vw - 50%))`
              : "translateX(50vw)",
          }}
        />
        <div
          data-ascii-container
          className={s("ascii")}
          style={split ? { transform: `translateX(calc(-${100 - splitPosition}vw))` } : {}}
        >
          <div
            className={s("asciiInner")}
            style={split ? { transform: `translateX(calc(${-splitPosition / 2}% + 50%))` } : {}}
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
            transform: split ? `translateX(${splitPosition}vw)` : undefined,
          }}
        >
          <div
            className={s("canvasInner", { split })}
            style={split ? { transform: `translateX(calc(-${50 + splitPosition / 2}%))` } : {}}
          >
            <Scene {...sceneProps} />
          </div>
        </div>
      </div>
    </div>
  );
};
