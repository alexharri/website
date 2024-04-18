import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const from = parseVector(THREE, [1, 2, 0]);
  const normal = parseVector(THREE, [1, -1, 0.3]).normalize();
  const to = from.clone().add(normal);

  return (
    <>
      <Vector color="blue" from={from} to={to} />
      <Point color="blue" position={from} />
      <Grid size={10} />
    </>
  );
});
