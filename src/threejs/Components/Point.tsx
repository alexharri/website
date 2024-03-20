import { SphereGeometry } from "three";
import { getPhongMaterial, IColor, IVector3, parseVector } from "../utils";

interface Props {
  position: IVector3;
  color: IColor;
}

export const Point: React.FC<Props> = (props) => {
  const radius = 0.1;
  const geometry = new SphereGeometry(radius, 10, 10);
  const material = getPhongMaterial(props.color);
  return <mesh geometry={geometry} material={material} position={parseVector(props.position)} />;
};
