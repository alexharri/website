import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Point } from "../Components/Point";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(() => {
  const normal = new Vector3(2, 1, 0.5).normalize();
  const point = new Vector3(1, 1.5, 1);
  const d1 = 3;
  const d2 = point.clone().dot(normal);

  const p0 = normal.clone().multiplyScalar(d2);
  const p1 = normal.clone().multiplyScalar(d1);
  const half = p0.clone().lerp(p1, 0.5);

  return (
    <>
      <Point position={point} color="red" />
      <Plane distance={d1} normal={normal} color="blue" />
      <Plane position={point} normal={normal} color="red" />
      <Vector color="green" from={half} to={p0} strictEnd />
      <Vector color="green" from={half} to={p1} strictEnd />
      <Grid size={10} />
    </>
  );
});
