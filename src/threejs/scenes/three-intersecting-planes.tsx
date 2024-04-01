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

    const n1 = new THREE.Vector3(1, -0.5, 0).normalize();
    const n2 = new THREE.Vector3(0, 1, -0.5).normalize();
    const n3 = new THREE.Vector3(0, 0, 1).normalize();

    const p1 = PlaneClass.fromPointAndNormal(point1, n1);
    const p2 = PlaneClass.fromPointAndNormal(point2, n2);
    const p3 = PlaneClass.fromPointAndNormal(point3, n3);

    const d22 = p2.normal.dot(p2.normal);
    const d23 = p2.normal.dot(p3.normal);
    const d33 = p3.normal.dot(p3.normal);

    const denom_old = d22 * d33 - d23 * d23;

    const k1 = (p2.distance * d33 - p3.distance * d23) / denom_old;
    const k2 = (p3.distance * d22 - p2.distance * d23) / denom_old;

    const u = p2.normal.cross(p3.normal);
    const u_x_p1 = u.clone().multiplyScalar(p1.distance);
    const denom = p1.normal.dot(u);

    const a = p2.normal.multiplyScalar(p3.distance);
    const b = p3.normal.multiplyScalar(p2.distance);
    const asubb = a.clone().sub(b);
    const cross = p1.normal.cross(asubb);

    const ip = u_x_p1.clone().add(cross).divideScalar(denom);

    const line = planePlaneIntersection(p2, p3)!;

    return (
      <>
        <mesh position={[3.5, 0, 0]} scale={0.9}>
          <Plane position={point1} normal={n1} color="white" transparent />
          <Plane position={point2} normal={n2} color="white" transparent />
          <Plane position={point3} normal={n3} color="white" transparent />

          <MathLabel label="P_1" position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
          <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
          <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

          <Vector strictEnd color="blue" to={p2.normal.multiplyScalar(k1)} />
          <Vector strictEnd color="green" to={p3.normal.multiplyScalar(k2)} />
          <Vector
            strictEnd
            color="green"
            from={p2.normal.multiplyScalar(k1)}
            to={p2.normal.multiplyScalar(k1).add(p3.normal.multiplyScalar(k2))}
          />
          <Vector
            strictEnd
            color="blue"
            from={p3.normal.multiplyScalar(k2)}
            to={p2.normal.multiplyScalar(k1).add(p3.normal.multiplyScalar(k2))}
          />

          <Point color="white" position={ip} />

          <Line
            from={line.point.clone().add(line.normal.clone().multiplyScalar(10))}
            to={line.point.clone().add(line.normal.clone().multiplyScalar(-10))}
            color={0x777777}
            radius={0.01}
          />
        </mesh>

        <mesh position={[-3.5, 0, 0]} scale={0.9}>
          <Plane position={point1} normal={n1} color="white" transparent />
          <Plane position={point2} normal={n2} color="white" transparent />
          <Plane position={point3} normal={n3} color="white" transparent />

          <MathLabel label="P_1" position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
          <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
          <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

          <Vector
            color="red"
            to={p2.normal.multiplyScalar(k1).add(p3.normal.multiplyScalar(k2))}
            strictEnd
          />
          <Point color="white" position={ip} />

          <Line
            from={line.point.clone().add(line.normal.clone().multiplyScalar(10))}
            to={line.point.clone().add(line.normal.clone().multiplyScalar(-10))}
            color={0x777777}
            radius={0.01}
          />
        </mesh>

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {},
  },
);
