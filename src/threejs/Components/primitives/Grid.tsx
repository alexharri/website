import { useContext } from "react";
import { lerp } from "../../../math/lerp";
import { DreiContext, ThreeContext } from "../ThreeProvider";

interface Props {
  size: number;
  light?: boolean;
}

export const Grid: React.FC<Props> = (props) => {
  const N = props.size;
  const HALF = N / 2;

  const THREE = useContext(ThreeContext);
  const DREI = useContext(DreiContext);

  const color = (i: number) => {
    const dist = Math.abs(i);
    const l = props.light ? lerp(0.08, 0.06, dist / HALF) : lerp(0.1, 0.07, dist / HALF);
    return new THREE.Color(l * 1, l * 1.15, l * 1.5);
  };

  return (
    <>
      {Array.from({ length: N + 1 }).map((_, _i) => {
        const i = -HALF + _i;
        const y = 0;
        const x = i;
        const z0 = HALF;
        const z1 = -HALF;
        return (
          <DREI.Line
            key={i}
            points={[
              [x, y, z0],
              [x, y, z1],
            ]}
            color={color(i)}
            lineWidth={1}
          />
        );
      })}
      {Array.from({ length: N + 1 }).map((_, _i) => {
        const i = -HALF + _i;
        const y = 0;
        const z = i;
        const x0 = HALF;
        const x1 = -HALF;
        return (
          <DREI.Line
            key={i}
            points={[
              [x0, y, z],
              [x1, y, z],
            ]}
            color={color(i)}
            lineWidth={1}
          />
        );
      })}
    </>
  );
};
