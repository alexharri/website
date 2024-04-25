import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Triangle } from "../Components/primitives/Triangle";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(() => {
  const points: [number, number, number][] = [
    [-1, 2, -1],
    [2, 3, 1.5],
    [1, -1, 2],
  ];

  const THREE = useContext(ThreeContext);
  const vectors = points.map((p) => parseVector(THREE, p));
  const [a, b, c] = vectors;

  return (
    <>
      <Triangle points={points} color="blue" />
      <Vector from={a} to={b} color="red" />
      <Vector from={a} to={c} color="green" />
      <MathLabel label="b_sub_a" position={a.clone().lerp(b, 0.5)} offset={[0, 1, 0]} scale={0.8} />
      <MathLabel
        label="c_sub_a"
        position={a.clone().lerp(c, 0.5)}
        offset={[0.5, 0, 0]}
        scale={0.8}
      />
      <MathLabel label="a" position={points[0]} offset={[0.25, 0.2, 0]} scale={0.8} />
      <MathLabel label="b" position={points[1]} offset={[-0.7, 0.5, 0]} scale={0.8} />
      <MathLabel label="c" position={points[2]} offset={[0, -0.2, 0]} scale={0.8} />
      <Grid size={6} />
    </>
  );
});
