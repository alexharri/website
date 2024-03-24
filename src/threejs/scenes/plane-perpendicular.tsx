import type THREE from "three";
import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const position = parseVector(THREE, [1, 2, 0]);
  const normal = parseVector(THREE, [1, -1, 0.3]).normalize();

  const forward = () => new THREE.Vector3(0, 0, 1);

  const mesh = new THREE.Mesh();
  mesh.lookAt(normal);
  mesh.rotateY(Math.PI / 2);
  const q0 = mesh.quaternion.clone();
  mesh.lookAt(normal);
  mesh.rotateX(Math.PI / 2);
  const q1 = mesh.quaternion.clone();

  const n0 = forward().applyQuaternion(q0);
  const n1 = forward().applyQuaternion(q0).multiplyScalar(-1);
  const n2 = forward().applyQuaternion(q1);
  const n3 = forward().applyQuaternion(q1).multiplyScalar(-1);

  const vecStart = (n: THREE.Vector3) => position.clone().add(n.clone().multiplyScalar(0.2));
  const vecEnd = (n: THREE.Vector3) => position.clone().add(n);
  const point = (n: THREE.Vector3) => position.clone().add(n.clone().multiplyScalar(1.2));

  return (
    <>
      <Vector color="blue" from={position} to={position.clone().add(normal)} />
      <Point color="blue" position={position} />

      <Vector color="red" from={vecStart(n0)} to={vecEnd(n0)} strictEnd />
      <Vector color="red" from={vecStart(n1)} to={vecEnd(n1)} strictEnd />
      <Vector color="red" from={vecStart(n2)} to={vecEnd(n2)} strictEnd />
      <Vector color="red" from={vecStart(n3)} to={vecEnd(n3)} strictEnd />

      <Point color="red" position={point(n0)} />
      <Point color="red" position={point(n1)} />
      <Point color="red" position={point(n2)} />
      <Point color="red" position={point(n3)} />

      <Plane position={position} normal={normal} color="blue" />
      <Grid size={10} />
    </>
  );
});
