import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Point } from "../Components/Point";
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
      <Plane position={avg} normal={normal} color="blue" width={7} />
      <Grid size={10} />
    </>
  );
});
