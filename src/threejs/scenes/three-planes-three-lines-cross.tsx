import React, { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane as PlaneClass } from "../../math/Plane";
import { Plane } from "../Components/primitives/Plane";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { Vector } from "../Components/primitives/Vector";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Line } from "../Components/primitives/Line";

export default createScene(({}) => {
  const THREE = useContext(ThreeContext);

  const n1 = new THREE.Vector3(Math.PI / 2, 1, 0).normalize();
  const n2 = new THREE.Vector3(-Math.PI / 2, 1, 0).normalize();
  const n3 = new THREE.Vector3(0, -1, 0).normalize();

  const point1 = n1.clone().multiplyScalar(1);
  const point2 = n2.clone().multiplyScalar(1);
  const point3 = n3.clone().multiplyScalar(1);

  const plane1 = PlaneClass.fromPointAndNormal(point1, n1);
  const plane2 = PlaneClass.fromPointAndNormal(point2, n2);
  const plane3 = PlaneClass.fromPointAndNormal(point3, n3);

  const pairs = [
    [plane1, plane2],
    [plane1, plane3],
    [plane2, plane3],
  ] as const;

  return (
    <>
      <Plane position={point1} normal={n1} color="white" transparent />
      <Plane position={point2} normal={n2} color="white" transparent />
      <Plane position={point3} normal={n3} color="white" transparent />

      {pairs.map(([p1, p2], i) => {
        const cross = p1.normal.cross(p2.normal).normalize();
        const intersection = planePlaneIntersection(p1, p2)!;

        return (
          <React.Fragment key={i}>
            <Vector
              color="white"
              from={intersection.point}
              to={intersection.point.clone().add(p1.normal)}
            />
            <Vector
              color="white"
              from={intersection.point}
              to={intersection.point.clone().add(p2.normal)}
            />
            <Vector
              color="red"
              from={intersection.point}
              to={intersection.point.clone().add(cross)}
            />
            <Line
              from={intersection.point.clone().add(cross.clone().multiplyScalar(3.3))}
              to={intersection.point.clone().add(cross.clone().multiplyScalar(-3.3))}
              color={0xeb4034}
              radius={0.015}
            />
          </React.Fragment>
        );
      })}

      <Grid size={6} light />
    </>
  );
});
