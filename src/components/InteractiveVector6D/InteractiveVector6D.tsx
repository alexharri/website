import React, { useMemo, useState } from "react";
import { useStyles } from "../../utils/styles";
import InteractiveVector6DStyles from "./InteractiveVector6D.styles";
import { Vector6D } from "../Vector6D/Vector6D";
import { NumberVariable } from "../variables";
import { CharacterMatcher } from "../AsciiRenderer/ascii/CharacterMatcher";
import { EFFECTS } from "../AsciiRenderer/ascii/effects";
import { getAlphabetMetadata } from "../AsciiRenderer/alphabets/AlphabetManager";

interface Vector6DProps {
  samplingVector: number[];
  externalVector?: number[];
  vary?: "global_exponent" | "directional_exponent";
  normalize?: boolean;
  showCharacterPick?: boolean;
  exclude?: string;
  drawAffects?: boolean;
  showOrder?: boolean;
}

export const InteractiveVector6D: React.FC<Vector6DProps> = ({
  samplingVector,
  externalVector,
  vary,
  normalize = true,
  showCharacterPick,
  exclude = "",
  drawAffects = false,
  showOrder,
}) => {
  const s = useStyles(InteractiveVector6DStyles);
  const [globalExponent, setGlobalExponent] = useState(1);
  const [directionalExponent, setDirectionalExponent] = useState(1);

  const metadata = useMemo(() => {
    if (externalVector && externalVector.length === 6) {
      return getAlphabetMetadata("simple-directional-crunch");
    }
    return getAlphabetMetadata("default");
  }, [externalVector]);

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
      const affectsMapping =
        "affectsMapping" in metadata.samplingConfig && metadata.samplingConfig.affectsMapping;
      if (!affectsMapping) {
        throw new Error(`Expected affectsMapping in metadata`);
      }
      let externalValue = 0;
      for (const externalIndex of affectsMapping[i]) {
        externalValue = Math.max(externalValue, externalVector[externalIndex]);
      }
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
    matcher.loadAlphabet("default", [EFFECTS.componentWiseGlobalNormalization], exclude);
    return matcher;
  }, [exclude]);

  const pickedCharacter = useMemo(() => {
    return characterMatcher.findBestCharacter(samplingVector);
  }, [...samplingVector, characterMatcher]);

  const affectsMapping =
    "affectsMapping" in metadata.samplingConfig
      ? metadata.samplingConfig.affectsMapping
      : undefined;

  function renderVariables(type: "below" | "above") {
    const showValue = type === "below" ? true : "only-value-on-hover";
    return (
      <>
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
            showValue={showValue}
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
            showValue={showValue}
            dataKey="exponent"
          />
        )}
      </>
    );
  }

  return (
    <div className={s("outerWrapper", { external: !!externalVector })}>
      <div className={s("wrapper", { showCharacterPick })}>
        <div className={s("vector")}>
          <Vector6D
            samplingVector={samplingVector}
            externalVector={externalVector}
            affectsMapping={drawAffects ? affectsMapping : undefined}
            showOrder={showOrder}
            noMargin
          />
        </div>
        {showCharacterPick && (
          <>
            <div className={s("arrow")}>{"→"}</div>
            <div className={s("character")}>{pickedCharacter}</div>
            <div className={s("banner", { bottom: true })}>
              Picked character: <strong>{pickedCharacter}</strong>
            </div>
          </>
        )}
      </div>
      <div className={s("variables")}>{renderVariables("below")}</div>
    </div>
  );
};
