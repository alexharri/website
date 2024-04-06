import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(
  ({ variables: { normal, x } }) => {
    const THREE = useContext(ThreeContext);
    const from = parseVector(THREE, [x, 2, 0]);
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
      normal: { label: "vec_n", type: "normal", value: [1, -1, 0.3] },
      x: { label: "p_x", type: "number", value: 1, range: [-3, 3] },
    },
  },
);
