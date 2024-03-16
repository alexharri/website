import { useMemo } from "react";
import * as THREE from "three";
import { Quaternion } from "three";
import { getMaterial, IColor, IVector3, parseVector } from "../utils";

let coneGeometry: THREE.ConeGeometry | null = null;
let cylinderGeometry: THREE.CylinderGeometry | null = null;

interface Props {
  from?: IVector3;
  to: IVector3;
  color: IColor;
}

export const Vector: React.FC<Props> = (props) => {
  const from = parseVector(props.from);
  const to = parseVector(props.to);

  const distance = to.distanceTo(from);
  const half = to.clone().add(from).multiplyScalar(0.5);
  const normal = half.clone().normalize();

  coneGeometry ||= new THREE.ConeGeometry(0.15, 0.3, 20);
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
