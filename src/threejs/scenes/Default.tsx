import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  return (
    <>
      <Vector to={[1, 0, 0]} color="red" />
      <Vector to={[0, 1, 0]} color="green" />
      <Vector to={[0, 0, 1]} color="blue" />
      <Plane
        distance={5}
        normal={new THREE.Vector3(1, 0.5, 1.6).normalize()}
        color="blue"
        showOriginLine
      />
      <Grid size={10} />
    </>
  );
});
