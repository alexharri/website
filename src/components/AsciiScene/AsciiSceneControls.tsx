import React from "react";
import { useStyles } from "../../utils/styles";
import { AlphabetName, getAvailableAlphabets } from "../AsciiRenderer/alphabets/AlphabetManager";
import AsciiSceneControlsStyles from "./AsciiSceneControls.styles";

interface AsciiSceneControlsProps {
  selectedAlphabet: AlphabetName;
  setSelectedAlphabet: (alphabet: AlphabetName) => void;
  characterWidthMultiplier: number;
  setCharacterWidthMultiplier: (value: number) => void;
  characterHeightMultiplier: number;
  setCharacterHeightMultiplier: (value: number) => void;
}

export const AsciiSceneControls: React.FC<AsciiSceneControlsProps> = ({
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
