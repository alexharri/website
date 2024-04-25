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

  const bsuba = b.clone().sub(a);
  const csuba = c.clone().sub(a);
  const cross = bsuba.clone().cross(csuba).multiplyScalar(0.2);

  return (
    <>
      <Triangle points={points} color="blue" />
      <Vector from={a} to={a.clone().add(bsuba)} color="red" />
      <Vector from={a} to={a.clone().add(csuba)} color="green" />
      <Vector from={a} to={a.clone().add(cross)} color="blue" />
      <MathLabel label="a" position={points[0]} offset={[0.25, 0.2, 0]} />
      <MathLabel label="b" position={points[1]} offset={[-0.7, 0.5, 0]} />
      <MathLabel label="c" position={points[2]} offset={[0, -0.2, 0]} />
      <MathLabel label="vec_d" position={a.clone().add(cross)} offset={[-0.15, 1.3, 0]} />
      <Grid size={6} />
    </>
  );
});
