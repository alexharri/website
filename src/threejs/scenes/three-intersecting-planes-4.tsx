import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/PlanePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
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
    const n3 = new THREE.Vector3(0, 0, -1).normalize();

    const p1 = PlaneClass.fromPointAndNormal(point1, n1);
    const p2 = PlaneClass.fromPointAndNormal(point2, n2);
    const p3 = PlaneClass.fromPointAndNormal(point3, n3);

    const u = p2.normal.cross(p3.normal);
    const denom = p1.normal.dot(u);

    const a = p2.normal.multiplyScalar(p3.distance);
    const b = p3.normal.multiplyScalar(p2.distance);
    const asubb = a.clone().sub(b);
    const cross = p1.normal.cross(asubb);

    const p2p3intersection = planePlaneIntersection(p2, p3)!;

    console.log(denom);

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <MathLabel label="P_1" position={point1} offset={[-1.4, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
        <MathLabel label="P_3" position={point3} offset={[-1.2, 1.2, 0]} normal={n3} />

        {/* <Vector color="red" to={u.clone().multiplyScalar(denom)} strictEnd /> */}
        <Vector color="red" to={cross.clone().divideScalar(denom)} strictEnd />
        {/* <Point color="white" position={first.clone()} /> */}
        {/* <Vector color="white" from={first} to={cross.clone().divideScalar(denom)} strictEnd /> */}
        {/* <Vector color="green" to={asubb} strictEnd /> */}
        {/* <Vector color="blue" to={p1.normal} strictEnd /> */}
        {/* <Vector color="blue" from={point1} to={point1.clone().add(p1.normal)} strictEnd /> */}
        {/* <Vector color="green" to={u} /> */}
        {/* <Point color="white" position={ip} /> */}

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
