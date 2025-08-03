import React, { useRef, useState } from "react";
import { Scene } from "../../threejs/scenes";
import { StyleOptions, useStyles } from "../../utils/styles";
import { AsciiRenderer } from "../AsciiRenderer";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: relative;
  `,

  controls: styled.css`
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    display: flex;
    gap: 8px;
    align-items: center;
    background: rgba(${theme.backgroundRgb}, 0.9);
    backdrop-filter: blur(8px);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${theme.text400};
    font-size: 14px;
  `,

  splitViewContainer: styled.css`
    display: flex;
    gap: 16px;

    &--vertical {
      flex-direction: column;
    }

    &--horizontal {
      flex-direction: row;
    }
  `,

  sceneWrapper: styled.css`
    flex: 1;
    min-width: 0;
    position: relative;
    overflow: hidden;
  `,

  button: styled.css`
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    color: ${theme.text};
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: ${theme.background500};
      border-color: ${theme.text700};
    }

    &--active {
      background: ${theme.background700};
      border-color: ${theme.text800};
    }
  `,

  label: styled.css`
    font-size: 12px;
    color: ${theme.text400};
  `,

  select: styled.css`
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    color: ${theme.text};
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    min-width: 100px;

    &:hover {
      background: ${theme.background500};
      border-color: ${theme.text700};
    }

    option {
      background: ${theme.background300};
      color: ${theme.text};
    }
  `,
});

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
  defaultSplitView?: boolean;
  splitDirection?: "horizontal" | "vertical";
  alphabet?: AlphabetName;
}

export const AsciiScene: React.FC<AsciiSceneProps> = ({
  scene,
  height,
  angle,
  autoRotate,
  usesVariables,
  zoom,
  yOffset,
  xRotation,
  showControls = true,
  defaultSplitView = false,
  splitDirection = "horizontal",
  alphabet = "default",
}) => {
  const s = useStyles(styles);
  const [splitView, setSplitView] = useState(defaultSplitView);
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>(alphabet);
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());

  const handleAlphabetChange = (newAlphabet: AlphabetName) => {
    setSelectedAlphabet(newAlphabet);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneProps = {
    scene,
    height: splitView ? height / (splitDirection === "vertical" ? 2 : 1) : height,
    angle,
    autoRotate,
    usesVariables,
    zoom,
    yOffset,
    xRotation,
    ascii: false, // Scene component no longer handles ASCII rendering
    canvasRef: canvasRef,
  };

  return (
    <div className={s("container")}>
      {showControls && (
        <div className={s("controls")}>
          <span className={s("label")}>Split:</span>
          <button
            className={s("button", { active: splitView })}
            onClick={() => setSplitView(!splitView)}
          >
            {splitView ? "ON" : "OFF"}
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

      <div style={{ position: "relative" }}>
        {splitView ? (
          <div className={s("splitViewContainer", { [splitDirection]: true })}>
            <div className={s("sceneWrapper")}>
              <AsciiRenderer canvasRef={canvasRef} alphabet={selectedAlphabet} />
            </div>
            <div className={s("sceneWrapper")}>
              <Scene {...sceneProps} />
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <AsciiRenderer canvasRef={canvasRef} alphabet={selectedAlphabet} />
            <div style={{ opacity: 0 }}>
              <Scene {...sceneProps} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
