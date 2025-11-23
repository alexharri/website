import React, { useMemo, useState } from "react";
import { useStyles } from "../../utils/styles";
import InteractiveVector6DStyles from "./InteractiveVector6D.styles";
import { lerp } from "../../math/lerp";
import { Vector6D } from "../Vector6D/Vector6D";
import { NumberVariable } from "../variables";
import { CharacterMatcher } from "../AsciiRenderer/ascii/CharacterMatcher";
import { EFFECTS } from "../AsciiRenderer/ascii/effects";

interface Vector6DProps {
  samplingVector: number[];
  externalVector?: number[];
  vary?: "exponent";
  normalize?: boolean;
  showCharacterPick?: boolean;
}

export const InteractiveVector6D: React.FC<Vector6DProps> = ({
  samplingVector,
  externalVector,
  vary,
  normalize,
  showCharacterPick,
}) => {
  const s = useStyles(InteractiveVector6DStyles);
  const [t, setT] = useState(0);
  const [exponent, setExponent] = useState(1);

  const maxValue = Math.max(...samplingVector);
  if (normalize) samplingVector = samplingVector.map((x) => x / maxValue);

  if (vary === "exponent") samplingVector = samplingVector.map((v) => Math.pow(v, exponent));

  if (normalize) samplingVector = samplingVector.map((x) => x * maxValue);

  const characterMatcher = useMemo(() => {
    const matcher = new CharacterMatcher();
    matcher.loadAlphabet("default", [EFFECTS.componentWiseGlobalNormalization]);
    return matcher;
  }, []);

  const pickedCharacter = useMemo(() => {
    return characterMatcher.findBestCharacter(samplingVector);
  }, [...samplingVector, characterMatcher]);

  return (
    <div className={s("outerWrapper")}>
      <div className={s("wrapper")}>
        <div className={s("vector")}>
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
        {vary === "exponent" && (
          <NumberVariable
            value={exponent}
            onValueChange={setExponent}
            spec={{
              range: [1, 2],
              value: exponent,
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
