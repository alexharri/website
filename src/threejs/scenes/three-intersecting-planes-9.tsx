import { useContext } from "react";
import { lerp } from "three/src/math/MathUtils";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { t1, t2 } = variables;
    const THREE = useContext(ThreeContext);

    const point1 = new THREE.Vector3(-2, 1, 0);
    const point2 = new THREE.Vector3(0, 1, 0);
    const point3 = new THREE.Vector3(0, 1.5, 0.5);

    const n1 = new THREE.Vector3(-1, lerp(1, 0, t1), 0).normalize();
    const n2 = new THREE.Vector3(0, 1, -0.5).normalize();
    const n3 = new THREE.Vector3(lerp(0.7, -0.7, t2), 0, -1).normalize();

    const p1 = PlaneClass.fromPointAndNormal(point1, n1);
    const p2 = PlaneClass.fromPointAndNormal(point2, n2);
    const p3 = PlaneClass.fromPointAndNormal(point3, n3);

    const u = p2.normal.cross(p3.normal);
    const u_x_p1 = u.clone().multiplyScalar(p1.distance);
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

        <MathLabel label="P_1" scale={1.4} position={point1} offset={[-1.4, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" scale={1.4} position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
        <MathLabel label="P_3" scale={1.4} position={point3} offset={[-1.2, 1.2, 0]} normal={n3} />

        <Vector color="red" to={cross.clone().divideScalar(denom)} strictEnd />
        <Vector
          color="green"
          from={cross.clone().divideScalar(denom)}
          to={cross.clone().divideScalar(denom).add(u_x_p1.clone().divideScalar(denom))}
          strictEnd
        />
        <Point
          color="white"
          position={u_x_p1.clone().divideScalar(denom).add(cross.clone().divideScalar(denom))}
        />

        <Line
          from={p2p3intersection.point
            .clone()
            .add(p2p3intersection.normal.clone().multiplyScalar(10))}
          to={p2p3intersection.point
            .clone()
            .add(p2p3intersection.normal.clone().multiplyScalar(-10))}
          color={0x777777}
          radius={0.015}
        />

        <Grid size={6} light />
      </>
    );
  },
  {
    variables: {
      t1: { label: "P1", type: "number", value: 0.5, range: [0, 1] },
      t2: { label: "P3", type: "number", value: 0.5, range: [0, 1] },
    },
  },
);
