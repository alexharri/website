import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Point } from "../Components/Point";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { normal } = variables;

    const point = new Vector3(3, 2, 1);
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
      // distance: { label: "d", type: "number", range: [0.5, 10], value: 2 },
      normal: { label: "vec_n", type: "normal", value: new Vector3(2, 0.5, 1).normalize() },
    },
  },
);
