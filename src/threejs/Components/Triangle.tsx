import * as THREE from "three";
import { MeshBasicMaterial } from "three";
import { getColor, IColor, IVector3, parseVector } from "../utils";
import { Line } from "./Line";

interface Props {
  points: IVector3[];
  color: IColor;
}

export const Triangle: React.FC<Props> = (props) => {
  const points = props.points.map(parseVector);
  const [a, b, c] = points;

  const geom = new THREE.BufferGeometry();
  geom.setFromPoints([a, b, c, c, b, a]);

  const planeMaterial = new MeshBasicMaterial({
    color: getColor(props.color),
    opacity: 0.2,
    transparent: true,
  });

  return (
    <>
      <Line from={a} to={b} color={props.color} thin />
      <Line from={b} to={c} color={props.color} thin />
      <Line from={c} to={a} color={props.color} thin />
      <mesh geometry={geom} material={planeMaterial} />
    </>
  );
};
