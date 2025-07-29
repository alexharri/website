import { useContext } from "react";
import { createScene } from "../createScene";
import { ThreeContext } from "../Components/ThreeProvider";

export default createScene(({ scene }) => {
  const THREE = useContext(ThreeContext);

  const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 16);
  const coneGeometry = new THREE.ConeGeometry(0.7, 1.8, 32);

  // More dramatic material with higher contrast
  const cubeMaterial = new THREE.MeshPhongMaterial({
    color: 0xe8e8e8,
    shininess: 30,
    specular: 0x222222,
  });

  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xf0f0f0,
    shininess: 80,
    specular: 0x444444,
  });

  const coneMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    shininess: 20,
    specular: 0x111111,
  });

  // Darker ambient for more contrast
  const ambientLight = new THREE.AmbientLight(0x90a0a0, 0.2);

  // Strong key light from above-right
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
  directionalLight1.position.set(8, 12, 4);
  directionalLight1.castShadow = true;

  // Subtle cool rim light for drama
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-6, 3, -4);

  // Warm fill light from below
  const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight3.position.set(2, -2, 6);

  // Darker background and more dramatic fog
  scene.fog = new THREE.Fog(0x0a0a0a, 3, 12);
  scene.background = new THREE.Color(0x0a0a0a);

  return (
    <>
      <primitive object={ambientLight} />
      <primitive object={directionalLight1} />
      <primitive object={directionalLight2} />
      <primitive object={directionalLight3} />

      {/* Left stack: cube and sphere */}
      <mesh geometry={cubeGeometry} material={cubeMaterial} position={[-2.2, -1, 0]} />
      <mesh geometry={sphereGeometry} material={sphereMaterial} position={[-1.5, 0.5, 0]} />

      {/* Center: tall cone */}
      <mesh geometry={coneGeometry} material={coneMaterial} position={[0, 0.3, 0]} />

      {/* Right stack: two cubes */}
      <mesh geometry={cubeGeometry} material={cubeMaterial} position={[1.5, -0.5, 0]} />
    </>
  );
});
