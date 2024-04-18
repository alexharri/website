import { useContext, useMemo } from "react";
import type THREE from "three";
import { getColor, getPhongMaterial, IColor, IVector3, parseVector } from "../../utils";
import { ThreeContext } from "../ThreeProvider";
import { Plane as PlaneClass } from "../../../math/Plane";

let cylinderGeometry: THREE.CylinderGeometry | null = null;

interface Props {
  plane?: PlaneClass;
  normal?: IVector3;
  position?: IVector3;
  width?: number;
  distance?: number;
  color: IColor;
  transparent?: boolean;
  opacity?: number;
}

export const Plane: React.FC<Props> = (props) => {
  const { transparent = false, opacity = 0.2 } = props;

  const THREE = useContext(ThreeContext);

  const normal = parseVector(THREE, props.plane?.normal ?? props.normal);
  const planePosition = props.position
    ? parseVector(THREE, props.position)
    : normal.clone().multiplyScalar(props.plane?.distance ?? props.distance ?? 0);

  const W = props.width ?? 5;
  const HALF = W / 2;

  const mesh = new THREE.Mesh();
  mesh.lookAt(normal);

  const color = getColor(props.color);
  const lineMaterial = getPhongMaterial(THREE, color);
  const planeGeometry = useMemo(() => new THREE.BoxGeometry(W, W, 0.01), [W]);
  const planeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        opacity,
        transparent: true,
        roughness: 0,
        transmission: 1,
      }),
    [color, opacity],
  );

  cylinderGeometry ||= new THREE.CylinderGeometry(0.015, 0.015, 1, 20);

  return (
    <>
      <mesh position={planePosition} quaternion={mesh.quaternion}>
        {!transparent && <mesh geometry={planeGeometry} material={planeMaterial} />}
        <mesh
          geometry={cylinderGeometry}
          position={[HALF, 0, 0]}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={[-HALF, 0, 0]}
          material={lineMaterial}
          scale={[1, W, 1]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={[0, HALF, 0]}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <mesh
          geometry={cylinderGeometry}
          position={[0, -HALF, 0]}
          material={lineMaterial}
          scale={[1, W, 1]}
          rotation={[0, 0, Math.PI / 2]}
        />
      </mesh>
    </>
  );
};
