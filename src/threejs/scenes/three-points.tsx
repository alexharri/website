import { Grid } from "../Components/Grid";
import { Point } from "../Components/Point";
import { Triangle } from "../Components/Triangle";
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
      <Grid size={10} />
    </>
  );
});
