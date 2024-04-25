import { useContext } from "react";
import { Plane } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as RenderPlane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
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
        <RenderPlane distance={plane0.distance} normal={plane0.normal} color="blue" />
        <RenderPlane distance={plane1.distance} normal={plane1.normal} color="red" />
        <Vector color="blue" to={plane0.normal} />
        <Vector color="red" to={plane1.normal} />
        {intersection && (
          <>
            <Vector
              color={0xcccccc}
              from={intersection.point}
              to={intersection.point.clone().add(intersection.normal)}
            />
            <Point color={0xcccccc} position={intersection.point} />
            <Line
              from={intersection.point.clone().sub(intersection.normal.clone().multiplyScalar(100))}
              to={intersection.point.clone().add(intersection.normal.clone().multiplyScalar(100))}
              color={0x888888}
              radius={0.015}
            />
          </>
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
