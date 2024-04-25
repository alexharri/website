import { useContext, useMemo } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);

    const points = useMemo(() => {
      const NX = 40;
      const NY = 32;

      const offsets: [number, number][] = [];
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          let x = -(NX / 2) + i;
          let y = -(NY / 2) + j;
          if (Math.abs(x) < 3 && Math.abs(y) < 3) continue;
          offsets.push([x, y]);
        }
      }

      return offsets
        .map(([x, y], i) => {
          const pos = new THREE.Vector3(x * 1.25, y * 1.25);
          const distance = Math.abs(x) + Math.abs(y);
          const radius = 0.05 - distance / 800;
          if (radius < 0) return null;
          return <Point key={i} color={0x2e6db0} basicMaterial radius={radius} position={pos} />;
        })
        .filter(Boolean);
    }, []);

    const mesh = new THREE.Mesh();
    mesh.lookAt(variables.n);

    const position = new THREE.Vector3(0, 1, 0);

    return (
      <>
        <Plane normal={variables.n} position={position} color="blue" />
        <mesh quaternion={mesh.quaternion} position={position}>
          {points}
        </mesh>
        <Grid size={8} />
      </>
    );
  },
  {
    variables: {
      n: { label: "Orientation", type: "normal", value: [1, -2, 3] },
    },
  },
);
