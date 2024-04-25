import { useContext } from "react";
import { Grid } from "../Components/primitives/Grid";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(() => {
  const THREE = useContext(ThreeContext);
  const normal = new THREE.Vector3(2, 1, 0.5).normalize();
  const point = new THREE.Vector3(1, 1.5, 1);
  const d1 = 3;
  const d2 = point.clone().dot(normal);
  const vOffs = new THREE.Vector3(0, 0, 0.15);

  return (
    <>
      <MathLabel
        label="P"
        position={normal.clone().multiplyScalar(d1)}
        normal={normal}
        offset={[1.25, 1.25, 0]}
        scale={1.4}
      />
      <MathLabel
        label="P_x"
        position={point}
        normal={normal}
        offset={[-1.25, 1.25, 0]}
        scale={1.4}
      />

      <Point position={point} color="red" />
      <Plane distance={d1} normal={normal} color="blue" />
      <Plane position={point} normal={normal} color="red" />
      <Vector
        color="red"
        from={vOffs}
        to={normal.clone().multiplyScalar(d2).add(vOffs)}
        strictEnd
      />
      <Vector
        color="blue"
        from={vOffs.clone().multiplyScalar(-1)}
        to={normal.clone().multiplyScalar(d1).sub(vOffs)}
        strictEnd
      />
      <Grid size={8} />
    </>
  );
});
