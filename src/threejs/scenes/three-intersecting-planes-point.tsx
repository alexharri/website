import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { threePlaneIntersection } from "../../math/threePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
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

    const l1 = planePlaneIntersection(p1, p2)!;
    const l2 = planePlaneIntersection(p1, p3)!;
    const l3 = planePlaneIntersection(p2, p3)!;

    return (
      <>
        <Plane position={point1} normal={n1} color="white" transparent />
        <Plane position={point2} normal={n2} color="white" transparent />
        <Plane position={point3} normal={n3} color="white" transparent />

        <MathLabel label="P_1" position={point1} offset={[1.4, 1.2, 0]} normal={n1} />
        <MathLabel label="P_2" position={point2} offset={[-1.4, -1.4, 0]} normal={n2} />
        <MathLabel label="P_3" position={point3} offset={[1.2, 1.2, 0]} normal={n3} />

        <Point color="white" position={threePlaneIntersection(p1, p2, p3)!} />

        {[l1, l2, l3].map((l, i) => (
          <Line
            key={i}
            from={l.point.clone().add(l.normal.clone().multiplyScalar(100))}
            to={l.point.clone().add(l.normal.clone().multiplyScalar(-100))}
            color={0x777777}
            radius={0.01}
          />
        ))}

        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {},
  },
);
