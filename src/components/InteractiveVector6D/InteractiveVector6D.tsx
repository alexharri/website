import React, { useMemo, useState } from "react";
import { useStyles } from "../../utils/styles";
import InteractiveVector6DStyles from "./InteractiveVector6D.styles";
import { Vector6D } from "../Vector6D/Vector6D";
import { NumberVariable } from "../variables";
import { CharacterMatcher } from "../AsciiRenderer/ascii/CharacterMatcher";
import { EFFECTS } from "../AsciiRenderer/ascii/effects";

interface Vector6DProps {
  samplingVector: number[];
  externalVector?: number[];
  vary?: "global_exponent" | "directional_exponent";
  normalize?: boolean;
  showCharacterPick?: boolean;
}

export const InteractiveVector6D: React.FC<Vector6DProps> = ({
  samplingVector,
  externalVector,
  vary,
  normalize = true,
  showCharacterPick,
}) => {
  const s = useStyles(InteractiveVector6DStyles);
  const [globalExponent, setGlobalExponent] = useState(1);
  const [directionalExponent, setDirectionalExponent] = useState(1);

  const maxValue = Math.max(...samplingVector);

  if (vary === "global_exponent") {
    samplingVector = samplingVector.map((value) => {
      if (normalize) value = value / maxValue;
      value = Math.pow(value, globalExponent);
      if (normalize) value = value * maxValue;
      return value;
    });
  }
  if (vary === "directional_exponent" && externalVector) {
    samplingVector = samplingVector.map((value, i) => {
      const externalValue = externalVector[i];
      if (externalValue <= value) {
        return value;
      }

      const normalized = value / externalValue;
      const enhanced = Math.pow(normalized, directionalExponent);
      return enhanced * externalValue;
    });
  }

  const characterMatcher = useMemo(() => {
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet("default", [EFFECTS.componentWiseGlobalNormalization], "");
    return matcher;
  }, []);

  const pickedCharacter = useMemo(() => {
    return characterMatcher.findBestCharacter(samplingVector);
  }, [...samplingVector, characterMatcher]);

  return (
    <div className={s("outerWrapper")}>
      <div className={s("wrapper")}>
        <div className={s("vector", { external: !!externalVector })}>
          <Vector6D samplingVector={samplingVector} externalVector={externalVector} />
        </div>
        {showCharacterPick && (
          <>
            <div className={s("arrow")}>{"→"}</div>
            <div className={s("characterPick")}>{pickedCharacter}</div>
          </>
        )}
      </div>
      <div className={s("variables")}>
        {vary === "global_exponent" && (
          <NumberVariable
            value={globalExponent}
            onValueChange={setGlobalExponent}
            spec={{
              range: [1, 2],
              value: globalExponent,
              label: "Exponent",
              step: 0.05,
            }}
            dataKey="exponent"
          />
        )}
        {vary === "directional_exponent" && (
          <NumberVariable
            value={directionalExponent}
            onValueChange={setDirectionalExponent}
            spec={{
              range: [1, 4],
              value: directionalExponent,
              label: "Exponent",
              step: 0.05,
            }}
            dataKey="exponent"
          />
        )}
        {/* <NumberVariable
          value={t}
          onValueChange={setT}
          spec={{
            range: [0, 1],
            value: t,
            label: "math:t",
            step: 0.05,
          }}
          dataKey="t"
        /> */}
      </div>
    </div>
  );
};
