import { useContext } from "react";
import { getPhongMaterial, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";

interface Props {
  position: IVector3;
  color: IColor;
}

export const Point: React.FC<Props> = (props) => {
  const THREE = useContext(ThreeContext);
  const radius = 0.1;
  const geometry = new THREE.SphereGeometry(radius, 10, 10);
  const material = getPhongMaterial(THREE, props.color);
  return (
    <mesh geometry={geometry} material={material} position={parseVector(THREE, props.position)} />
  );
};
