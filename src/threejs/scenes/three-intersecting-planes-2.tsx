import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/PlanePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({}) => {
    const THREE = useContext(ThreeContext);

    const point1 = new THREE.Vector3(-2, 1, 0);
    const point2 = new THREE.Vector3(0, 1, 0);
    const point3 = new THREE.Vector3(0, 1.5, 0.5);

    const n1 = new THREE.Vector3(-1, 0.5, 0).normalize();
    const n2 = new THREE.Vector3(0, 1, -0.5).normalize();
    const n3 = new THREE.Vector3(0, 0, 1).normalize();

    const p1 = PlaneClass.fromPointAndNormal(point1, n1);
    const p2 = PlaneClass.fromPointAndNormal(point2, n2);
    const p3 = PlaneClass.fromPointAndNormal(point3, n3);

    const d22 = p2.normal.dot(p2.normal);
    const d23 = p2.normal.dot(p3.normal);
    const d33 = p3.normal.dot(p3.normal);

    const denom_old = d22 * d33 - d23 * d23;

    const k2 = (p2.distance * d33 - p3.distance * d23) / denom_old;
    const k3 = (p3.distance * d22 - p2.distance * d23) / denom_old;

    const first = p2.normal.multiplyScalar(k2).add(p3.normal.multiplyScalar(k3));

    const u = p2.normal.cross(p3.normal);
    const denom = p1.normal.dot(u);

    const a = p2.normal.multiplyScalar(p3.distance);
    const b = p3.normal.multiplyScalar(p2.distance);
    const asubb = a.clone().sub(b);
    const cross = p1.normal.cross(asubb);

    const p2p3intersection = planePlaneIntersection(p2, p3)!;

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <MathLabel label="P_1" position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
        <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

        <Vector color="red" to={cross.clone().divideScalar(denom)} strictEnd />
        <Point color="white" position={first.clone()} />
        {/* <Vector
          color={0x960505}
          to={p2.normal.multiplyScalar(k2).add(p3.normal.multiplyScalar(k3))}
          strictEnd
        /> */}

        <Line
          from={p2p3intersection.point
            .clone()
            .add(p2p3intersection.normal.clone().multiplyScalar(10))}
          to={p2p3intersection.point
            .clone()
            .add(p2p3intersection.normal.clone().multiplyScalar(-10))}
          color={0x777777}
          radius={0.01}
        />
        {/* <Point color="red" position={d} /> */}
        {/* <Vector to={v} color="red" />
        <Vector to={d} color="blue" />
        <Vector to={u} color="green" /> */}

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {},
  },
);
