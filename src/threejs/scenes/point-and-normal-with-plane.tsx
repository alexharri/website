import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Point } from "../Components/Point";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(
  ({ variables: { normal } }) => {
    const from = parseVector([1, 2, 0]);
    const to = from.clone().add(normal);

    return (
      <>
        <Vector color="blue" from={from} to={to} />
        <Point color="blue" position={from} />
        <Plane color="blue" position={from} normal={normal} />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      normal: { label: "vec_n", type: "normal", value: parseVector([1, -1, 0.3]).normalize() },
    },
  },
);
