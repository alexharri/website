import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { Vector } from "../Components/primitives/Vector";

export default createScene(
  ({}) => {
    const THREE = useContext(ThreeContext);

    const n1 = new THREE.Vector3(Math.PI / 2, 1, 0).normalize();
    const n2 = new THREE.Vector3(-Math.PI / 2, 1, 0).normalize();
    const n3 = new THREE.Vector3(0, -1, 0).normalize();

    const point1 = n1.clone().multiplyScalar(1);
    const point2 = n2.clone().multiplyScalar(1);
    const point3 = n3.clone().multiplyScalar(1);

    const cross = n1.clone().cross(n2);

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <Vector color="white" to={n1} />
        <Vector color="white" to={n2} />
        <Vector color="red" to={cross} />

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {},
  },
);
