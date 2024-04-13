import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as PlaneClass } from "../../math/Plane";
import { rayPlaneIntersection } from "../../math/RayPlaneIntersection";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { MathLabel } from "../Components/primitives/MathLabel";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);
    const planeNormal = new THREE.Vector3(2, 1, 0.5).normalize();
    const planeDistance = 3;

    const linePoint = new THREE.Vector3(-1, 0.7, -1);
    const lineNormal = variables.n;

    let end = rayPlaneIntersection(
      new PlaneClass(planeDistance, planeNormal),
      lineNormal,
      linePoint,
    );

    const mesh = new THREE.Mesh();
    mesh.lookAt(planeNormal);
    const quat = mesh.quaternion;

    const left = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);

    const planePoint = planeNormal.clone().multiplyScalar(planeDistance);
    const planeNormalEnd = planePoint.clone().add(planeNormal);

    const leftDist = end ? Math.abs(left.dot(planePoint.clone().sub(end))) : 0;
    const upDist = end ? Math.abs(up.dot(planePoint.clone().sub(end))) : 0;

    const W = Math.max(5, Math.max(leftDist, upDist) + 3);
    const planePos = end ? planePoint.clone().lerp(end, 0.5) : planePoint;

    const denom = planeNormal.dot(lineNormal);
    const D0 = planeDistance - planeNormal.dot(linePoint);
    const D1 = (planeDistance - planeNormal.dot(linePoint)) / denom;
    const p = linePoint.clone().add(lineNormal.clone().multiplyScalar(D1));

    return (
      <>
        <Point position={linePoint} color="red" />
        <Line
          color={0x888888}
          from={linePoint.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={linePoint}
          basicMaterial
          radius={0.01}
        />

        {end && (
          <>
            <Point position={p} color="white" />
            <Point
              position={linePoint.clone().add(lineNormal.clone().multiplyScalar(D0))}
              color="red"
            />
            <MathLabel
              position={linePoint.clone().add(lineNormal.clone().multiplyScalar(D0))}
              label="P"
              offset={[0.2, 0.1, 0]}
            />
          </>
        )}
        <Vector from={linePoint} to={linePoint.clone().add(lineNormal)} color="red" strictEnd />

        <Plane position={planePos} normal={planeNormal} width={W} color="blue" />
        <Vector from={planePoint} to={planeNormalEnd} color="blue" />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      n: {
        label: "vec_n",
        type: "normal",
        value: [0.61, 0.28, 0.74],
      },
    },
  },
);
