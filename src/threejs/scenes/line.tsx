import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { n1 } = variables;
    const THREE = useContext(ThreeContext);

    const normal = n1;
    const point = new THREE.Vector3(0, 1, 0);

    return (
      <>
        <Point color="white" position={point} />
        <Vector color="white" from={point} to={point.clone().add(normal)} />
        <Line
          from={point.clone().sub(normal.clone().multiplyScalar(100))}
          to={point.clone().add(normal.clone().multiplyScalar(100))}
          color={0x777777}
          radius={0.015}
        />
        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {
      n1: { label: "n1", type: "normal", value: [0.4, 0.2, 0.03] },
    },
  },
);
