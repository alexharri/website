import { useMemo, useRef, useState } from "react";
import { createWiggle } from "../../../math/wiggle";
import { createCanvas } from "./Canvas";

export const SomeNoise = () => {
  const [amplitude, setAmplitude] = useState(1);
  const amplitudeRef = useRef(amplitude);
  amplitudeRef.current = amplitude;

  const Canvas = useMemo(() => {
    return createCanvas(() => {
      const speed = 3;
      const wiggleX = createWiggle();
      const wiggleY = createWiggle();
      return () => {
        const amplitude = amplitudeRef.current;
        return [wiggleX(speed, amplitude), wiggleY(speed, amplitude)];
      };
    });
  }, []);

  return (
    <div>
      <Canvas />
      <div style={{ margin: "0px auto", textAlign: "center" }}>
        Amplitude
        <input
          type="range"
          min={0.2}
          max={3}
          value={amplitude}
          onChange={(e) => setAmplitude(Number(e.target.value))}
          step={0.1}
        />
      </div>
    </div>
  );
};
