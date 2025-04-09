import { useContext } from "react";
import { Plane } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/intersection";
import { lerp } from "../../math/lerp";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as RenderPlane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Quad } from "../Components/primitives/Quad";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { rot } = variables;
    const THREE = useContext(ThreeContext);

    const n0 = new THREE.Vector3(-0.5, 2, 0).normalize();
    const n1_1 = new THREE.Vector3(2, 0.5);
    const n1_2 = new THREE.Vector3(2, -0.7);
    const n1 = n1_1.clone().lerp(n1_2, rot).normalize();

    const p1 = new Plane(1, n0);
    const p2 = new Plane(2, n1);

    const intersection = planePlaneIntersection(p1, p2);

    const end = intersection?.point ?? new THREE.Vector3(0, 0, 0);

    const p1org = p1.normal.multiplyScalar(p1.distance);
    const p1mid = p1org.clone().lerp(end, 0.5);
    const p1W = p1org.distanceTo(end) + 1.5;

    const p2org = p2.normal.multiplyScalar(p2.distance);
    const p2mid = p2org.clone().lerp(end, 0.5);
    const p2W = p2org.distanceTo(end) + 1.5;

    const quadScalar = lerp(4, 5, rot);

    return (
      <>
        <RenderPlane position={p1mid} normal={p1.normal} color="blue" width={p1W} transparent />
        <RenderPlane position={p2mid} normal={p2.normal} color="red" width={p2W} transparent />
        <Vector strictEnd color="blue" to={p1.normal} />
        <Vector strictEnd color="red" to={p2.normal} />
        <Quad
          color={0xffffff}
          points={[
            new THREE.Vector3(0, 0, 0),
            p1.normal.multiplyScalar(quadScalar),
            p1.normal.multiplyScalar(quadScalar).add(p2.normal.multiplyScalar(quadScalar)),
            p2.normal.multiplyScalar(quadScalar),
          ]}
        />
        {intersection && (
          <>
            <Point color={0xcccccc} position={intersection.point} />
            <Line
              from={intersection.point.clone().sub(intersection.normal.clone().multiplyScalar(100))}
              to={intersection.point.clone().add(intersection.normal.clone().multiplyScalar(100))}
              color={0x888888}
              radius={0.015}
            />
          </>
        )}
        <Grid size={8} light />
      </>
    );
  },
  {
    variables: {
      rot: { label: "Angle of red plane", type: "number", value: 0.3, range: [0, 1], step: 0.01 },
    },
  },
);
