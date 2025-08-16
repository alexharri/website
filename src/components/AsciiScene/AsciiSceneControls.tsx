import React from "react";
import { useStyles } from "../../utils/styles";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import { SegmentedControl } from "../SegmentedControl";
import { ViewMode } from "../SplitView";
import AsciiSceneControlsStyles from "./AsciiSceneControls.styles";

interface AsciiSceneControlsProps {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  setSplitT: (value: number) => void;
  selectedAlphabet: AlphabetName;
  setSelectedAlphabet: (alphabet: AlphabetName) => void;
  characterWidthMultiplier: number;
  setCharacterWidthMultiplier: (value: number) => void;
  characterHeightMultiplier: number;
  setCharacterHeightMultiplier: (value: number) => void;
}

export const AsciiSceneControls: React.FC<AsciiSceneControlsProps> = ({
  viewMode,
  setViewMode,
  setSplitT,
  selectedAlphabet,
  setSelectedAlphabet,
  characterWidthMultiplier,
  setCharacterWidthMultiplier,
  characterHeightMultiplier,
  setCharacterHeightMultiplier,
}) => {
  const s = useStyles(AsciiSceneControlsStyles);
  const availableAlphabets = getAvailableAlphabets();

  const handleAlphabetChange = (newAlphabet: AlphabetName) => {
    setSelectedAlphabet(newAlphabet);
  };

  return (
    <div className={s("controls")}>
      <div className={s("controlGroup")}>
        <span className={s("label")}>View:</span>
        <SegmentedControl
          options={[
            { value: "left", label: "ASCII" },
            { value: "split", label: "Split" },
            { value: "transparent", label: "Transparent" },
            { value: "right", label: "Canvas" },
          ]}
          value={viewMode}
          setValue={(value) => {
            setViewMode(value);
            if (value === "split") {
              setSplitT(0.5);
            }
          }}
        />
      </div>

      <div className={s("controlGroup")}>
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
            min="0.3"
            max="4.0"
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
  );
};
