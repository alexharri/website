import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { lerp } from "../../math/lerp";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { t } = variables;

    const THREE = useContext(ThreeContext);

    const point1 = new THREE.Vector3(lerp(-4, 0, 1 - t), lerp(2, 0, 1 - t), 0);
    const point2 = new THREE.Vector3(0, 1, 0);
    const point3 = new THREE.Vector3(0, 1.5, 0.5);

    const n1 = new THREE.Vector3(1, -0.5, 0).normalize();
    const n2 = new THREE.Vector3(0, 1, -0.5).normalize();
    const n3 = new THREE.Vector3(0, 0, 1).normalize();

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

    const ip = u_x_p1.clone().add(cross).divideScalar(denom);

    const line = planePlaneIntersection(p2, p3)!;

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <MathLabel label="P_1" position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
        <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

        <Point color="white" position={ip} />

        <Line
          from={line.point.clone().add(line.normal.clone().multiplyScalar(10))}
          to={line.point.clone().add(line.normal.clone().multiplyScalar(-10))}
          color={0x777777}
          radius={0.01}
        />

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {
      t: { label: "P1's distance from origin", type: "number", value: 0.5, range: [0, 1] },
    },
  },
);
