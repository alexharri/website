import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Point } from "../Components/primitives/Point";
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
  const cross = bsuba.clone().cross(csuba);
  const normal = cross.clone().normalize();
  const avg = new THREE.Vector3()
    .add(a)
    .add(b)
    .add(c)
    .multiplyScalar(1 / 3);

  return (
    <>
      {points.map((p, i) => (
        <Point key={i} color="blue" position={p} />
      ))}
      <Vector color="blue" from={avg} to={avg.clone().add(normal)} />
      <Triangle points={points} color="blue" />
      <MathLabel label="vec_n" position={avg.clone().add(normal)} offset={[-0.6, -0.2, 0]} />
      <Grid size={6} />
    </>
  );
});
