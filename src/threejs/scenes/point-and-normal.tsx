import { Grid } from "../Components/Grid";
import { Point } from "../Components/Point";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(() => {
  const from = parseVector([1, 2, 0]);
  const normal = parseVector([1, -1, 0.3]).normalize();
  const to = from.clone().add(normal);

  return (
    <>
      <Vector color="red" from={from} to={to} />
      <Point color="red" position={from} />
      <Grid size={10} />
    </>
  );
});
