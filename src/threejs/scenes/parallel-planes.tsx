import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const normal = new THREE.Vector3(1, 0.5, 0).normalize();

  return (
    <>
      <Plane position={[1, 1, 0]} normal={normal} color="blue" />
      <Plane position={[-1, 1, 0]} normal={normal} color="red" />
      <Grid size={8} light />
    </>
  );
});
