import { useContext, useMemo } from "react";
import { getColor, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";
import { Line } from "./Line";

interface Props {
  points: IVector3[];
  color: IColor;
}

export const Triangle: React.FC<Props> = (props) => {
  const THREE = useContext(ThreeContext);
  const points = props.points.map((p) => parseVector(THREE, p));
  const [a, b, c] = points;

  const geometry = new THREE.BufferGeometry();
  // prettier-ignore
  geometry.setFromPoints([
    a, b, c,
    c, b, a,
  ]);

  const planeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: getColor(props.color),
        opacity: 0.2,
        transparent: true,
      }),
    [],
  );

  return (
    <>
      <Line from={a} to={b} color={props.color} thin />
      <Line from={b} to={c} color={props.color} thin />
      <Line from={c} to={a} color={props.color} thin />
      <mesh geometry={geometry} material={planeMaterial} />
    </>
  );
};
