import { useMemo } from "react";
import * as THREE from "three";
import { Quaternion } from "three";
import { getMaterial, IColor, IVector3, parseVector } from "../utils";

let coneGeometry: THREE.ConeGeometry | null = null;
let cylinderGeometry: THREE.CylinderGeometry | null = null;

const CONE_HEIGHT = 0.3;

interface Props {
  from?: IVector3;
  to: IVector3;
  color: IColor;
  strictEnd?: boolean;
}

export const Vector: React.FC<Props> = (props) => {
  const from = parseVector(props.from);
  let to = parseVector(props.to);

  const normal = to.clone().sub(from).normalize();

  if (props.strictEnd) to.sub(normal.clone().multiplyScalar(CONE_HEIGHT / 2));

  let distance = to.distanceTo(from);
  let half = to.clone().add(from).multiplyScalar(0.5);

  coneGeometry ||= new THREE.ConeGeometry(0.15, CONE_HEIGHT, 20);
  cylinderGeometry ||= new THREE.CylinderGeometry(0.05, 0.05, 1, 20);

  const quat = useMemo(
    () => new Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [],
  );

  const material = getMaterial(props.color);

  return (
    <>
      <mesh
        geometry={cylinderGeometry}
        material={material}
        position={half}
        quaternion={quat}
        scale={[1, distance, 1]}
      />
      <mesh geometry={coneGeometry} quaternion={quat} position={to} material={material} />
    </>
  );
};
