import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as PlaneClass } from "../../math/Plane";
import { rayPlaneIntersection } from "../../math/rayPlaneIntersection";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);
    const planeNormal = new THREE.Vector3(2, 1, 0.5).normalize();
    const planeDistance = 3;

    const linePoint = new THREE.Vector3(-1, 0.7, -1);
    const lineNormal = variables.n;

    const end = rayPlaneIntersection(
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

    return (
      <>
        <Point position={linePoint} color="red" />
        {end && <Point position={end} color="white" />}
        <Line
          color={0x888888}
          from={linePoint.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={linePoint}
          basicMaterial
          radius={0.015}
        />

        <Vector from={linePoint} to={linePoint.clone().add(lineNormal)} color="red" strictEnd />

        <Plane position={planePos} normal={planeNormal} width={W} color="blue" />
        <Vector from={planePoint} to={planeNormalEnd} color="blue" />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      n: { label: "math:vec_n_l", type: "normal", value: [1.5, 0.5, 0.1] },
    },
  },
);
