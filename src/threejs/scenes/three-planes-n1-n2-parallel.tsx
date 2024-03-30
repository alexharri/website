import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({}) => {
    const THREE = useContext(ThreeContext);

    const point1 = new THREE.Vector3(1.75, 0, 0);
    const point2 = new THREE.Vector3(0.25, 0, 0);
    const point3 = new THREE.Vector3(0, 0, 0.5);

    const n1 = new THREE.Vector3(1, 0, 0).normalize();
    const n2 = new THREE.Vector3(1, 0, 0).normalize();
    const n3 = new THREE.Vector3(0, 0.5, -1).normalize();

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <MathLabel label="P_1" position={point1} offset={[1.2, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" position={point2} offset={[1.2, 0, 0]} normal={n2} />
        <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {},
  },
);
