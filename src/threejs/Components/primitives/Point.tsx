import { useContext } from "react";
import type THREE from "three";
import { getBasicMaterial, getPhongMaterial, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";

const geometryByRadius: Record<number, THREE.SphereGeometry> = {};

interface Props {
  position: IVector3;
  color: IColor;
  basicMaterial?: boolean;
  radius?: number;
}

export const Point: React.FC<Props> = (props) => {
  const THREE = useContext(ThreeContext);
  const radius = props.radius ?? 0.1;
  const geometry = (geometryByRadius[radius] ??= new THREE.SphereGeometry(radius, 10, 10));
  const material = props.basicMaterial
    ? getBasicMaterial(THREE, props.color)
    : getPhongMaterial(THREE, props.color);
  return (
    <mesh geometry={geometry} material={material} position={parseVector(THREE, props.position)} />
  );
};
