import { useMemo, useState } from "react";
import { createWiggle } from "../../../math/wiggle";
import { useStateRef } from "../../../utils/hooks/useStateRef";
import { StyleOptions, useStyles } from "../../../utils/styles";
import { Slider } from "../../Slider/Slider";
import { createOptionExample } from "./generators/OptionExample";

const styles = ({ styled }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin: 40px auto;
  `,
});

export const LargeStickinessFactors = () => {
  const s = useStyles(styles);

  const [amplitude, setAmplitude, amplitudeRef] = useStateRef(1);
  const [stickiness, setStickiness] = useState(0.2);

  const OptionExample = useMemo(() => {
    return createOptionExample(
      () => {
        const speed = 3;
        const wiggleX = createWiggle();
        const wiggleY = createWiggle();
        return () => {
          const amplitude = amplitudeRef.current;
          return [wiggleX(speed, amplitude), wiggleY(speed, amplitude)];
        };
      },
      { showScores: true, showGap: true },
    );
  }, []);

  return (
    <div className={s("wrapper")}>
      <Slider label="Amplitude" value={amplitude} setValue={setAmplitude} range={[0.2, 3]} />
      <Slider
        label="Stickiness"
        value={stickiness}
        setValue={setStickiness}
        range={[0, 10]}
        step={1}
      />
      <OptionExample stickiness={stickiness} />
    </div>
  );
};
