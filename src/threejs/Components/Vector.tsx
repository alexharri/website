import { useMemo } from "react";
import * as THREE from "three";
import { Quaternion } from "three";
import { getBasicMaterial, getPhongMaterial, IColor, IVector3, parseVector } from "../utils";
import { Line } from "./Line";

let coneGeometry: THREE.ConeGeometry | null = null;

const CONE_HEIGHT = 0.3;

interface Props {
  from?: IVector3;
  to: IVector3;
  color: IColor;
  strictEnd?: boolean;
  basicMaterial?: boolean;
}

export const Vector: React.FC<Props> = (props) => {
  const from = parseVector(props.from);
  let to = parseVector(props.to);

  const normal = to.clone().sub(from).normalize();

  if (props.strictEnd) to.sub(normal.clone().multiplyScalar(CONE_HEIGHT / 2));

  coneGeometry ||= new THREE.ConeGeometry(0.15, CONE_HEIGHT, 20);

  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [normal],
  );

  return (
    <>
      <Line from={from} to={to} color={props.color} basicMaterial={props.basicMaterial} />
      <mesh
        geometry={coneGeometry}
        quaternion={quaternion}
        position={to}
        material={
          props.basicMaterial ? getBasicMaterial(props.color) : getPhongMaterial(props.color)
        }
      />
    </>
  );
};
