import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { createScene } from "../createScene";
import { ThreeContext } from "../Components/ThreeProvider";

export default createScene(() => {
  const THREE = useContext(ThreeContext);

  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial = new THREE.MeshLambertMaterial({
    color: 0x15cf53,
  });

  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(5, 10, 2);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-3, 2, -3);

  return (
    <>
      <primitive object={ambientLight} />
      <primitive object={directionalLight1} />
      <primitive object={directionalLight2} />
      <mesh geometry={cubeGeometry} material={cubeMaterial} />
      <Grid size={6} />
    </>
  );
});
