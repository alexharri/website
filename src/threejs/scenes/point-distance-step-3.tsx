import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const normal = new THREE.Vector3(2, 1, 0.5).normalize();
  const point = new THREE.Vector3(1, 1.5, 1);
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
