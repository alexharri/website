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
  const distance = 3;
  const point = new THREE.Vector3(1, 1.5, 1);

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
