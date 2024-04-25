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
import { linePlaneIntersection } from "../../math/linePlaneIntersection";
import { lerp } from "../../math/lerp";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);

    const planeNormal = new THREE.Vector3(2, 1, 0.5).normalize();
    const planeDistance = 3;
    const planePoint = planeNormal.clone().multiplyScalar(planeDistance);
    const planeNormalEnd = planePoint.clone().add(planeNormal);

    const lp1 = new THREE.Vector3(0, 0.7, -1);
    const lp2 = new THREE.Vector3(0, 1.7, 1);
    const lineNormal = variables.n;

    const e1 = rayPlaneIntersection(new PlaneClass(planeDistance, planeNormal), lineNormal, lp1);
    const e2 = linePlaneIntersection(new PlaneClass(planeDistance, planeNormal), lineNormal, lp2);

    const mesh = new THREE.Mesh();
    mesh.lookAt(planeNormal);
    const quat = mesh.quaternion;

    const left = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);

    let leftDist = 0;
    let upDist = 0;

    if (e1) {
      leftDist = left.dot(planePoint.clone().sub(e1));
      upDist = up.dot(planePoint.clone().sub(e1));
    }
    if (e2) {
      const ld = left.dot(planePoint.clone().sub(e2));
      const ud = up.dot(planePoint.clone().sub(e2));

      if (e1) {
        if (ld < 0 !== leftDist < 0) {
          const sum = Math.abs(ld) + Math.abs(leftDist);
          const t = ld / sum;
          leftDist = lerp(leftDist, ld, t);
        } else if (Math.abs(ld) > Math.abs(leftDist)) leftDist = ld;

        if (ud < 0 !== upDist < 0) {
          const sum = Math.abs(ud) + Math.abs(upDist);
          const t = -ud / sum;
          upDist = lerp(upDist, ud, t);
        } else if (Math.abs(ud) > Math.abs(upDist)) upDist = ud;
      } else {
        leftDist = ld;
        upDist = ud;
      }
    }

    const pos = planePoint
      .clone()
      .add(up.clone().multiplyScalar(-upDist))
      .add(left.clone().multiplyScalar(-leftDist));

    const W = Math.max(5, Math.max(Math.abs(leftDist), Math.abs(upDist)) + 3);
    const planePos =
      leftDist !== 0 || upDist !== 0 ? planePoint.clone().lerp(pos, 0.5) : planePoint;

    return (
      <>
        <Point position={lp1} color="red" />
        <Vector from={lp1} to={lp1.clone().add(lineNormal)} color="red" strictEnd />
        <Line
          color={0xe03f3f}
          from={lp1.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={lp1}
          basicMaterial
          radius={0.015}
        />
        {e1 && <Point position={e1} color="red" />}

        <Point position={lp2} color="green" />
        <Vector from={lp2} to={lp2.clone().add(lineNormal)} color="green" strictEnd />
        <Line
          color={0x33913d}
          from={lp2.clone().add(lineNormal.clone().multiplyScalar(100))}
          to={lp2.clone().add(lineNormal.clone().multiplyScalar(-100))}
          basicMaterial
          radius={0.015}
        />
        {e2 && <Point position={e2} color="green" />}

        <Plane position={planePos} normal={planeNormal} width={W} color="blue" />
        <Vector from={planePoint} to={planeNormalEnd} color="blue" />

        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      n: { label: "math:vec_n", type: "normal", value: [-0.84, -0.38, -0.39] },
    },
  },
);
