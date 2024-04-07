import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const normal = new THREE.Vector3(2, 1, 0.5).normalize();
  const planeDistance = 3;

  const point = new THREE.Vector3(-1, 0.7, -1);
  const pointDistance = normal.dot(point);

  const D = pointDistance - planeDistance;
  const S = point.clone().sub(normal.clone().multiplyScalar(D));

  const end = S;
  const mid = end.clone().lerp(point, 0.66);

  const planePos = normal.clone().multiplyScalar(planeDistance);
  const planeNormalEnd = planePos.clone().add(normal);

  return (
    <>
      <Point position={point} color="red" />
      <Point position={end} color="white" />
      <Vector from={point} to={end} color="red" strictEnd />

      <MathLabel label="x" position={point} offset={[-0.18, -0.3, 0]} />
      <MathLabel label="D" position={mid} offset={[-0.3, 1, 0]} />
      <MathLabel label="S" position={end} offset={[-0.2, 0.9, 0]} />
      <MathLabel label="vec_n" position={planeNormalEnd} offset={[-0.2, 0.9, 0]} />

      <Plane distance={planeDistance} normal={normal} color="blue" />
      <Vector from={planePos} to={planeNormalEnd} color="blue" />
      <Grid size={10} />
    </>
  );
});
