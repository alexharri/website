import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane as PlaneClass } from "../../math/Plane";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Line } from "../Components/primitives/Line";

export default createScene(({}) => {
  const THREE = useContext(ThreeContext);

  const n1 = new THREE.Vector3(Math.PI / 2, 1, 0).normalize();
  const n2 = new THREE.Vector3(-Math.PI / 2, 1, 0).normalize();
  const n3 = new THREE.Vector3(0, -1, 0).normalize();

  return (
    <>
      {[1, -1].map((n) => {
        const point1 = n1.clone().multiplyScalar(n === 1 ? 1 : 0);
        const point2 = n2.clone().multiplyScalar(n === 1 ? 1 : 0);
        const point3 = n3.clone().multiplyScalar(n === 1 ? 1 : 0);

        const plane1 = PlaneClass.fromPointAndNormal(point1, n1);
        const plane2 = PlaneClass.fromPointAndNormal(point2, n2);
        const plane3 = PlaneClass.fromPointAndNormal(point3, n3);

        const i1 = planePlaneIntersection(plane1, plane2)!;
        const i2 = planePlaneIntersection(plane2, plane3)!;
        const i3 = planePlaneIntersection(plane3, plane1)!;
        return (
          <mesh position={[3 * n, n === 1 ? 0 : 0.5, 0]} scale={0.8} key={n}>
            <Plane position={point1} normal={n1} color="white" transparent />
            <Plane position={point2} normal={n2} color="white" transparent />
            <Plane position={point3} normal={n3} color="white" transparent />

            {(n === 1 ? [i1, i2, i3] : [i1]).map(({ point }, i) => (
              <Line
                key={i}
                from={point.clone().add(new THREE.Vector3(0, 0, 3.3))}
                to={point.clone().add(new THREE.Vector3(0, 0, -3.3))}
                color={0xff0000}
                radius={0.02}
              />
            ))}
          </mesh>
        );
      })}

      <mesh position={[0, -1.35, 0]}>
        <Grid size={8} light />
      </mesh>
    </>
  );
});
