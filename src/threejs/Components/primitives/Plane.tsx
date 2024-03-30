import { useContext } from "react";
import type THREE from "three";
import { getColor, getPhongMaterial, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";
import { Vector } from "./Vector";
import { Plane as PlaneClass } from "../../../math/Plane";

let cylinderGeometry: THREE.CylinderGeometry | null = null;

interface Props {
  plane?: PlaneClass;
  normal?: IVector3;
  position?: IVector3;
  width?: number;
  distance?: number;
  color: IColor;
  showCenter?: boolean;
  showNormal?: boolean;
  showOriginLine?: boolean;
  transparent?: boolean;
  opacity?: number;
}

export const Plane: React.FC<Props> = (props) => {
  const { showCenter, showNormal, showOriginLine, transparent = false, opacity = 0.2 } = props;

  const THREE = useContext(ThreeContext);

  const normal = parseVector(THREE, props.plane?.normal ?? props.normal);
  const planePosition = props.position
    ? parseVector(THREE, props.position)
    : normal.clone().multiplyScalar(props.plane?.distance ?? props.distance ?? 0);

  const W = props.width ?? 5;
  const HALF = W / 2;

  const mesh = new THREE.Mesh();
  mesh.lookAt(normal);

  const planeGeometry = new THREE.BoxGeometry(W, W, 0.01);

  const color = getColor(props.color);

  const planeMaterial = new THREE.MeshPhysicalMaterial({
    color,
    opacity,
    transparent: true,
    roughness: 0,
    transmission: 1,
  });

  cylinderGeometry ||= new THREE.CylinderGeometry(0.015, 0.015, 1, 20);
  const lineMaterial = getPhongMaterial(THREE, color);

  const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

  return (
    <>
      {showCenter && (
        <mesh
          geometry={boxGeometry}
          material={getPhongMaterial(THREE, color)}
          position={planePosition}
          quaternion={mesh.quaternion}
        />
      )}
      {showNormal && (
        <Vector color={props.color} from={planePosition} to={planePosition.clone().add(normal)} />
      )}
      {showOriginLine && <Vector color={props.color} to={planePosition} strictEnd />}
      <mesh position={planePosition} quaternion={mesh.quaternion}>
        {!transparent && <mesh geometry={planeGeometry} material={planeMaterial} />}
        <mesh
          geometry={cylinderGeometry}
          position={parseVector(THREE, { x: HALF, y: 0, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector(THREE, { x: -HALF, y: 0, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector(THREE, { x: 0, y: HALF, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={new THREE.Euler(0, 0, Math.PI / 2)}
        />
        <mesh
          geometry={cylinderGeometry}
          position={parseVector(THREE, { x: 0, y: -HALF, z: 0 })}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={new THREE.Euler(0, 0, Math.PI / 2)}
        />
      </mesh>
    </>
  );
};
