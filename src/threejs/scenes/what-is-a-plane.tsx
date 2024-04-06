import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    return (
      <>
        <Plane normal={variables.n} color="blue" />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      n: { label: "Orientation", type: "normal", value: [1, -2, 3] },
    },
  },
);
