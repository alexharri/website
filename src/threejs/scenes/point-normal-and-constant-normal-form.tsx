import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { normal } = variables;

    const THREE = useContext(ThreeContext);
    const point = new THREE.Vector3(3, 2, 1);
    const distance = normal.clone().dot(point);
    const dPoint = normal.clone().multiplyScalar(distance);
    const midPoint = point.clone().lerp(dPoint, 0.5);
    const width = point.distanceTo(dPoint) + 1.5;

    return (
      <>
        <Vector from={point} to={point.clone().add(normal)} color="blue" strictEnd />
        <Point position={point} color="blue" />
        <Vector to={dPoint} color="green" strictEnd />
        <Plane width={width} position={midPoint} normal={normal} color="blue" />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      normal: { label: "math:vec_n", type: "normal", value: [2, 0.5, 1] },
    },
  },
);
