import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  return (
    <>
      <Plane normal={new THREE.Vector3(1, -2, 3).normalize()} color="blue" />
      <Grid size={10} />
    </>
  );
});
