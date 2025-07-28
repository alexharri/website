import { useContext } from "react";
import { createScene } from "../createScene";
import { ThreeContext } from "../Components/ThreeProvider";

export default createScene(({ scene }) => {
  const THREE = useContext(ThreeContext);

  const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });

  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight1.position.set(5, 10, 2);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight2.position.set(-3, 2, -3);

  scene.fog = new THREE.Fog(0x111111, 2, 8);
  scene.background = new THREE.Color(0x111111);

  return (
    <>
      <primitive object={ambientLight} />
      <primitive object={directionalLight1} />
      <primitive object={directionalLight2} />
      <mesh geometry={cubeGeometry} material={cubeMaterial} position={[0, -1, 0]} />
      <mesh geometry={cubeGeometry} material={cubeMaterial} position={[0, 1, 0]} />
      <mesh geometry={cubeGeometry} material={cubeMaterial} position={[2, -1, 0]} />
      {/* <mesh geometry={cubeGeometry} material={cubeMaterial} position={[0, 2, -6]} /> */}
    </>
  );
});
