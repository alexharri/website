import { useContext } from "react";
import { getColor, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";
import { Line } from "./Line";

interface Props {
  points: IVector3[];
  color: IColor;
}

export const Quad: React.FC<Props> = (props) => {
  const THREE = useContext(ThreeContext);
  const points = props.points.map((p) => parseVector(THREE, p));

  const [a, b, c, d] = points;

  const geom = new THREE.BufferGeometry();
  geom.setFromPoints([a, b, d, b, c, d, d, b, a, d, c, b]);

  const planeMaterial = new THREE.MeshBasicMaterial({
    color: getColor(props.color),
    opacity: 0.1,
    transparent: true,
  });

  const lines = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    lines.push(<Line key={i} from={a} to={b} color={props.color} thin />);
  }

  return (
    <>
      {lines}
      <mesh geometry={geom} material={planeMaterial} />
    </>
  );
};
