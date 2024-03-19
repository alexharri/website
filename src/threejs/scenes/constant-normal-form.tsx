import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { normal, distance } = variables;

    return (
      <>
        <Vector to={normal.clone().multiplyScalar(distance)} color="blue" strictEnd />
        <Plane normal={normal} distance={distance} color="blue" />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      distance: { label: "d", type: "number", range: [0, 10], value: 2 },
      normal: { type: "normal", value: new Vector3(2, 1, 0.5).normalize() },
    },
  },
);
