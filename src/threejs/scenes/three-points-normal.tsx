import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Point } from "../Components/Point";
import { Triangle } from "../Components/Triangle";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(() => {
  const points: [number, number, number][] = [
    [-1, 2, -1],
    [2, 3, 1.5],
    [1, -1, 2],
  ];

  const vectors = points.map(parseVector);
  const [a, b, c] = vectors;

  const bsuba = b.clone().sub(a);
  const csuba = c.clone().sub(a);
  const cross = bsuba.clone().cross(csuba);
  const normal = cross.clone().normalize();
  const avg = new Vector3()
    .add(a)
    .add(b)
    .add(c)
    .multiplyScalar(1 / 3);

  return (
    <>
      {points.map((p, i) => (
        <Point key={i} color="blue" position={p} />
      ))}
      <Vector color="red" from={avg} to={avg.clone().add(normal)} />
      <Vector color="blue" from={avg} to={avg.clone().add(normal.clone().multiplyScalar(-1))} />
      <Triangle points={points} color="blue" />
      <Grid size={10} />
    </>
  );
});
