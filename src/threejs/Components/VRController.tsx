import Three from "three";
import { useContext, useEffect, useState } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { getPhongMaterial, IVector3, parseVector } from "../utils";
import { ThreeContext } from "./ThreeProvider";

interface Props {
  position: IVector3;
  normal: IVector3;
}

export const VRController: React.FC<Props> = (props) => {
  const THREE = useContext(ThreeContext);

  const [geometry, setGeometry] = useState<Three.BufferGeometry>();

  useEffect(() => {
    const loader = new STLLoader();
    loader.load("/3d-models/meta-quest-3-controller.stl", (geometry) => {
      geometry.computeVertexNormals();
      setGeometry(geometry);
    });
  }, []);

  const normal = parseVector(THREE, props.normal);
  const position = parseVector(THREE, props.position);

  const mesh = new THREE.Mesh();
  mesh.lookAt(normal);
  const quaternion = mesh.quaternion;

  return (
    <mesh position={position} quaternion={quaternion} scale={1.5}>
      <mesh
        geometry={geometry}
        position={[-0.01, -0.15, -1.1]}
        material={getPhongMaterial(THREE, 0xeeeeee)}
        scale={0.01}
        rotation={[-Math.PI * 0.45, 0, 0, "YXZ"]}
        receiveShadow
        castShadow
      />
    </mesh>
  );
};
