import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Point } from "../Components/Point";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(() => {
  const normal = new Vector3(2, 1, 0.5).normalize();
  const distance = 3;
  const point = new Vector3(1, 1.5, 1);

  return (
    <>
      <Point position={point} color="red" />
      <Plane distance={distance} normal={normal} color="blue" />
      <Plane position={point} normal={normal} color="red" />
      <Vector color="blue" to={normal.clone().multiplyScalar(distance)} strictEnd />
      <Grid size={10} />
    </>
  );
});
