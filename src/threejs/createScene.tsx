import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface SceneProps {
  camera: THREE.PerspectiveCamera;
}

export const createScene = (Component: React.FC<SceneProps>) => () => {
  const [down, setDown] = useState(false);

  const camera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(40);
    camera.position.set(0, 7.5, -15);
    return camera;
  }, []);

  return (
    <Canvas
      style={{ height: 500, userSelect: "none", cursor: down ? "grabbing" : "grab" }}
      camera={camera}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
    >
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <OrbitControls rotateSpeed={0.3} autoRotate enablePan={false} enableZoom={false} />

      <Component camera={camera} />
    </Canvas>
  );
};
