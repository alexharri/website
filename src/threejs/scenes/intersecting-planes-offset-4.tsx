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
    const { rot } = variables;
    const THREE = useContext(ThreeContext);

    const n0 = new THREE.Vector3(-0.5, 2, 0).normalize();
    const n1_1 = new THREE.Vector3(2, 0.5);
    const n1_2 = new THREE.Vector3(2, -2);
    const n1 = n1_1.clone().lerp(n1_2, rot).normalize();

    const p1 = new Plane(1, n0);
    const p2 = new Plane(2, n1);

    const dot = p1.normal.dot(p2.normal);
    const denom = 1 - dot * dot;

    const k1 = p1.distance - p2.distance * 0;
    const k2 = p2.distance - p1.distance * 0;

    const intersection = planePlaneIntersection(p1, p2);

    const end = intersection?.point ?? new THREE.Vector3(0, 0, 0);

    const p1org = p1.normal.multiplyScalar(p1.distance);
    const p1mid = p1org.clone().lerp(end, 0.5);
    const p1W = p1org.distanceTo(end) + 1.5;

    const p2org = p2.normal.multiplyScalar(p2.distance);
    const p2mid = p2org.clone().lerp(end, 0.5);
    const p2W = p2org.distanceTo(end) + 1.5;

    return (
      <>
        <RenderPlane position={p1mid} normal={p1.normal} color="blue" width={p1W} />
        <RenderPlane position={p2mid} normal={p2.normal} color="red" width={p2W} />
        <Point color="blue" position={p1org} />
        <Point color="red" position={p2org} />
        <Vector strictEnd color="blue" to={p1.normal.multiplyScalar(k1)} />
        <Vector strictEnd color="red" to={p2.normal.multiplyScalar(k2)} />
        <Vector
          strictEnd
          color="red"
          from={p1.normal.multiplyScalar(k1)}
          to={p1.normal.multiplyScalar(k1).add(p2.normal.multiplyScalar(k2))}
        />
        <Vector
          strictEnd
          color="blue"
          from={p2.normal.multiplyScalar(k2)}
          to={p1.normal.multiplyScalar(k1).add(p2.normal.multiplyScalar(k2))}
        />
        {intersection && (
          <>
            <Line
              from={intersection.point.clone().multiplyScalar(10)}
              to={intersection.point.clone().multiplyScalar(-10)}
              color={0x888888}
              radius={0.01}
            />
            <Point color={0xcccccc} position={intersection.point} />
          </>
        )}
        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {
      rot: { label: "Angle of red plane", type: "number", value: 0, range: [0, 1] },
    },
  },
);
