import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Vector } from "../Components/primitives/Vector";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { normal, distance } = variables;

    return (
      <>
        <Vector to={normal.clone().multiplyScalar(distance)} color="blue" strictEnd />
        <Plane normal={normal} distance={distance} color="blue" width={4.3} />
        <Grid size={6} />
      </>
    );
  },
  {
    variables: {
      distance: { label: "math:d", type: "number", range: [0.5, 5], value: 2 },
      normal: { label: "math:vec_n", type: "normal", value: [2, 1, 0.5] },
    },
  },
);
