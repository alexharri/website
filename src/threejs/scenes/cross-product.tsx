import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);

  const i = new THREE.Vector3(0, 0, -1);
  const j = new THREE.Vector3(0, 1, 0);
  const k = i.clone().cross(j);

  return (
    <>
      <Vector to={i} color="blue" />
      <Vector to={j} color="red" />
      <Vector to={k} color="green" />

      <MathLabel label="vec_i" position={i.clone().multiplyScalar(1.5)} offset={[0, 0.5, 0]} />
      <MathLabel label="vec_j" position={j} offset={[0.4, 0.7, 0]} />
      <MathLabel label="vec_k" position={k.clone().multiplyScalar(1.5)} offset={[0, 0.5, 0]} />

      <Grid size={6} />
    </>
  );
});
