import { BoxGeometry, CylinderGeometry, Euler, Mesh, MeshPhysicalMaterial } from "three";
import { getColor, getPhongMaterial, IColor, IVector3, parseVector } from "../utils";
import { Vector } from "./Vector";

let cylinderGeometry: CylinderGeometry | null = null;

interface Props {
  normal: IVector3;
  position?: IVector3;
  width?: number;
  distance?: number;
  color: IColor;
  showCenter?: boolean;
  showNormal?: boolean;
  showOriginLine?: boolean;
}

export const Plane: React.FC<Props> = (props) => {
  const { showCenter, showNormal, showOriginLine } = props;

  const normal = parseVector(props.normal);
  const planePosition = props.position
    ? parseVector(props.position)
    : normal.clone().multiplyScalar(props.distance ?? 0);

  const W = props.width ?? 5;
  const HALF = W / 2;

  const mesh = new Mesh();
  mesh.lookAt(normal);

  const planeGeometry = new BoxGeometry(W, W, 0.01);

  const color = getColor(props.color);

  const planeMaterial = new MeshPhysicalMaterial({
    color,
    opacity: 0.35,
    transparent: true,
    roughness: 0,
    transmission: 1,
  });

  cylinderGeometry ||= new CylinderGeometry(0.015, 0.015, 1, 20);
  const lineMaterial = getPhongMaterial(color);

  const boxGeometry = new BoxGeometry(0.1, 0.1, 0.1);

  return (
    <>
      {showCenter && (
        <mesh
          geometry={boxGeometry}
          material={getPhongMaterial(color)}
          position={planePosition}
          quaternion={mesh.quaternion}
        />
      )}
      {showNormal && (
        <Vector color={props.color} from={planePosition} to={planePosition.clone().add(normal)} />
      )}
      {showOriginLine && <Vector color={props.color} to={planePosition} strictEnd />}
      <mesh
        geometry={planeGeometry}
        position={planePosition}
        material={planeMaterial}
        quaternion={mesh.quaternion}
      >
        <mesh
          geometry={cylinderGeometry}
          position={parseVector({ x: HALF, y: 0, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector({ x: -HALF, y: 0, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector({ x: 0, y: HALF, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={new Euler(0, 0, Math.PI / 2)}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector({ x: 0, y: -HALF, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={new Euler(0, 0, Math.PI / 2)}
        />
      </mesh>
    </>
  );
};
