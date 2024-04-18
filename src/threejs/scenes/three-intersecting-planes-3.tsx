import { useContext } from "react";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
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
  const n3 = new THREE.Vector3(0, 0, -1).normalize();

  const p1 = PlaneClass.fromPointAndNormal(point1, n1);
  const p2 = PlaneClass.fromPointAndNormal(point2, n2);
  const p3 = PlaneClass.fromPointAndNormal(point3, n3);

  const a = p2.normal.multiplyScalar(p3.distance);
  const b = p3.normal.multiplyScalar(p2.distance);
  const asubb = a.clone().sub(b);
  const cross = p1.normal.cross(asubb);

  const line = planePlaneIntersection(p2, p3)!;

  return (
    <>
      <Plane position={point1} normal={n1} color="white" transparent />
      <Plane position={point2} normal={n2} color="white" transparent />
      <Plane position={point3} normal={n3} color="white" transparent />

      <Vector color="red" to={cross} strictEnd />

      <MathLabel label="vec_v1" position={p1.normal} offset={[-0.3, 0.9, 0]} />
      <MathLabel label="vec_v2" position={asubb} offset={[-0.5, -0.2, 0]} />

      <Vector color="green" to={asubb} strictEnd />
      <Vector color="blue" to={p1.normal} strictEnd />

      <Line
        from={line.point.clone().add(line.normal.clone().multiplyScalar(10))}
        to={line.point.clone().add(line.normal.clone().multiplyScalar(-10))}
        color={0x777777}
        radius={0.01}
      />

      <Grid size={10} light />
    </>
  );
});
