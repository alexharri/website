import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Point } from "../Components/primitives/Point";
import { Triangle } from "../Components/primitives/Triangle";
import { createScene } from "../createScene";

export default createScene(() => {
  const points: [number, number, number][] = [
    [-1, 2, -1],
    [2, 3, 1.5],
    [1, -1, 2],
  ];

  return (
    <>
      {points.map((p, i) => (
        <Point key={i} color="blue" position={p} />
      ))}
      <Triangle points={points} color="blue" />
      <MathLabel label="a" position={points[0]} offset={[0.25, 0.2, 0]} />
      <MathLabel label="b" position={points[1]} offset={[-0.7, 0.5, 0]} />
      <MathLabel label="c" position={points[2]} offset={[0, -0.2, 0]} />
      <Grid size={10} />
    </>
  );
});
