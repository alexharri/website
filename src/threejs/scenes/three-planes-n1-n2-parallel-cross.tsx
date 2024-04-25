import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(({}) => {
  const THREE = useContext(ThreeContext);

  const point1 = new THREE.Vector3(1.75, 0, 0);
  const point2 = new THREE.Vector3(0, 0, 0);
  const point3 = new THREE.Vector3(0, 0, 0);

  const n1 = new THREE.Vector3(1, 0, 0).normalize();
  const n2 = new THREE.Vector3(1, 0, 0).normalize();
  const n3 = new THREE.Vector3(0, 0.5, -1).normalize();

  const cross = n2.clone().cross(n3);

  return (
    <>
      <Plane position={point1} normal={n1} color="white" transparent />
      <Plane position={point2} normal={n2} color="white" transparent />
      <Plane position={point3} normal={n3} color="white" transparent />

      <MathLabel label="P_1" scale={1.4} position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
      <MathLabel label="P_2" scale={1.4} position={point2} offset={[1.4, -0.5, 0]} normal={n2} />
      <MathLabel label="P_3" scale={1.4} position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

      <Vector to={cross} color="red" />
      <Vector to={n2} color="white" />
      <Vector to={n3} color="white" />

      <Grid size={6} light />
    </>
  );
});
