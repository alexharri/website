import { useContext } from "react";
import { lerp } from "../../../utils/lerp";
import { DreiContext, ThreeContext } from "../ThreeProvider";

interface Props {
  size: number;
}

export const Grid: React.FC<Props> = (props) => {
  const N = props.size;
  const HALF = N / 2;

  const THREE = useContext(ThreeContext);
  const DREI = useContext(DreiContext);

  const color = (i: number) => {
    const dist = Math.abs(i);
    const l = lerp(0.15, 0.1, dist / HALF);
    return new THREE.Color(l, l, l);
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
