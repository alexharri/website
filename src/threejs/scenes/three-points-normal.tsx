import { Grid } from "../Components/Grid";
import { MathLabel } from "../Components/MathLabel";
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

  return (
    <>
      {points.map((p, i) => (
        <Point key={i} color="blue" position={p} />
      ))}
      <Vector color="blue" from={a} to={a.clone().add(normal)} />
      <Triangle points={points} color="blue" />
      <MathLabel label="vec_n" position={a.clone().add(normal)} offset={[0.2, 0.9, 0]} />
      <Grid size={10} />
    </>
  );
});
