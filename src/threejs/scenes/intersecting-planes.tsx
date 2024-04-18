import { useContext } from "react";
import { Plane } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as RenderPlane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { n1 } = variables;
    const THREE = useContext(ThreeContext);

    const n0 = new THREE.Vector3(1, 0.5, -0.3).normalize();

    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(0, 0, 0);

    const plane0 = Plane.fromPointAndNormal(p0, n0);
    const plane1 = Plane.fromPointAndNormal(p1, n1);

    const intersection = planePlaneIntersection(plane0, plane1);

    return (
      <>
        <RenderPlane normal={plane0.normal} distance={plane0.distance} color="blue" />
        <RenderPlane normal={plane1.normal} distance={plane1.distance} color="red" />
        {intersection && (
          <Line
            from={intersection.point.clone().sub(intersection.normal.clone().multiplyScalar(100))}
            to={intersection.point.clone().add(intersection.normal.clone().multiplyScalar(100))}
            color={0xcccccc}
            radius={0.02}
          />
        )}
        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {
      n1: { label: "math:vec_n", type: "normal", value: [0.4, 0.2, -1] },
    },
  },
);
