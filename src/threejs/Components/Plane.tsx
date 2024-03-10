import { BoxGeometry, MeshBasicMaterial } from "three";
import { getColor, IColor, IVector3, parseVector } from "../utils";

interface Props {
  normal: IVector3;
  distance: number;
  color: IColor;
}

export const Plane: React.FC<Props> = (props) => {
  const normal = parseVector(props.normal);
  const position = normal.multiplyScalar(props.distance);

  const geometry = new BoxGeometry(5, 5, 0.0001);
  geometry.lookAt(normal);

  const color = getColor(props.color);
  const material = new MeshBasicMaterial({
    color,
    opacity: 0.5,
    transparent: true,
  });

  return <mesh geometry={geometry} position={position} material={material} />;
};
