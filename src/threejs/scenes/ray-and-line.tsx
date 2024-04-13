import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);

    const lp1 = new THREE.Vector3(0, 0.7, -1);
    const lp2 = new THREE.Vector3(0, 1.7, 1);
    const lineNormal = variables.n;

    return (
      <>
        <Point position={lp1} color="red" />
        <Vector from={lp1} to={lp1.clone().add(lineNormal)} color="red" strictEnd />
        <Line
          color={0xe03f3f}
          from={lp1.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={lp1}
          basicMaterial
          radius={0.01}
        />

        <Point position={lp2} color="green" />
        <Vector from={lp2} to={lp2.clone().add(lineNormal)} color="green" strictEnd />
        <Line
          color={0x33913d}
          from={lp2.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={lp2.clone().add(lineNormal.clone().multiplyScalar(-100))}
          basicMaterial
          radius={0.01}
        />

        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      n: { label: "vec_n", type: "normal", value: [1.5, 0.5, 0.1] },
    },
  },
);
