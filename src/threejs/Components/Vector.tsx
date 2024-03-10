import { useMemo } from "react";
import * as THREE from "three";
import { MeshPhongMaterial, Quaternion, Vector3 } from "three";

type IVector3 = { x: number; y: number; z: number } | [number, number, number];

interface Props {
  from?: IVector3;
  to: IVector3;
}

function makeVector(vec?: IVector3) {
  if (!vec) return new Vector3(0, 0, 0);
  if (Array.isArray(vec)) return new Vector3(vec[0], vec[1], vec[2]);
  return new Vector3(vec.x, vec.y, vec.z);
}

let coneGeometry: THREE.ConeGeometry | null = null;
let cylinderGeometry: THREE.CylinderGeometry | null = null;

export const Vector: React.FC<Props> = (props) => {
  const from = makeVector(props.from);
  const to = makeVector(props.to);

  const distance = useMemo(() => to.distanceTo(from), []);
  const half = useMemo(() => to.clone().sub(from).multiplyScalar(0.5), []);
  const normal = useMemo(() => half.clone().normalize(), []);

  coneGeometry ||= new THREE.ConeGeometry(0.15, 0.3, 20);
  cylinderGeometry ||= new THREE.CylinderGeometry(0.05, 0.05, 1, 20);

  const quat = useMemo(
    () => new Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [],
  );

  const material = useMemo(() => new MeshPhongMaterial({ color: 0xff0000 }), []);

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
