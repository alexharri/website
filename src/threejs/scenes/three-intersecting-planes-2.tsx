import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Quad } from "../Components/primitives/Quad";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(({}) => {
  const THREE = useContext(ThreeContext);

  const point1 = new THREE.Vector3(-2, 1, 0);
  const point2 = new THREE.Vector3(0, 1, 0);
  const point3 = new THREE.Vector3(0, 1.5, 0.5);

  const n1 = new THREE.Vector3(-1, 0.5, 0).normalize();
  const n2 = new THREE.Vector3(0, 1, -0.5).normalize();
  const n3 = new THREE.Vector3(0, 0, 1).normalize();

  const p2 = PlaneClass.fromPointAndNormal(point2, n2);
  const p3 = PlaneClass.fromPointAndNormal(point3, n3);

  const d22 = p2.normal.dot(p2.normal);
  const d23 = p2.normal.dot(p3.normal);
  const d33 = p3.normal.dot(p3.normal);

  const denom = d22 * d33 - d23 * d23;

  const k2 = (p2.distance * d33 - p3.distance * d23) / denom;
  const k3 = (p3.distance * d22 - p2.distance * d23) / denom;

  const first = p2.normal.multiplyScalar(k2).add(p3.normal.multiplyScalar(k3));

  const line = planePlaneIntersection(p2, p3)!;

  const quadScalar = 4;

  return (
    <>
      <Plane position={point1} normal={n1} color="white" transparent />
      <Plane position={point2} normal={n2} color="white" transparent />
      <Plane position={point3} normal={n3} color="white" transparent />

      <Vector color="green" to={first} strictEnd />
      <MathLabel position={first} label="a" offset={[0.2, 0.4, 0]} />

      <Vector strictEnd color="blue" to={p2.normal.multiplyScalar(k2)} />
      <Vector strictEnd color="red" to={p3.normal.multiplyScalar(k3)} />

      <Quad
        color={0x1a92e8}
        points={[
          new THREE.Vector3(0, 0, 0),
          p2.normal.multiplyScalar(quadScalar),
          p2.normal.multiplyScalar(quadScalar).add(p3.normal.multiplyScalar(quadScalar)),
          p3.normal.multiplyScalar(quadScalar),
        ]}
      />

      <Line
        from={line.point.clone().add(line.normal.clone().multiplyScalar(10))}
        to={line.point.clone().add(line.normal.clone().multiplyScalar(-10))}
        color={0x777777}
        radius={0.015}
      />

      <Grid size={10} light />
    </>
  );
});
