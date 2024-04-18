import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(({}) => {
  const THREE = useContext(ThreeContext);

  const point1_1 = new THREE.Vector3(0, 0, 0);
  const point2_1 = new THREE.Vector3(-0.7, 0, 0);
  const point3_1 = new THREE.Vector3(0.7, 0, 0);

  const n1_1 = new THREE.Vector3(0, 0.5, -1).normalize();
  const n2_1 = new THREE.Vector3(1, 0, 0).normalize();
  const n3_1 = new THREE.Vector3(1, 0, 0).normalize();

  return (
    <>
      <mesh position={[3.5, 1.5, 0]} scale={0.8}>
        <Plane position={point1_1} normal={n1_1} color="white" transparent />
        <Plane position={point2_1} normal={n2_1} color="white" transparent />
        <Plane position={point3_1} normal={n3_1} color="white" transparent />
      </mesh>

      <mesh position={[-3.5, 0, 0]} scale={0.8}>
        <Plane position={[0, 1, 0]} normal={[0, 1, 0]} color="white" transparent />
        <Plane position={[0, 2, 0]} normal={[0, 1, 0]} color="white" transparent />
        <Plane position={[0, 3, 0]} normal={[0, 1, 0]} color="white" transparent />
      </mesh>

      <Grid size={10} light />
    </>
  );
});
