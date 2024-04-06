import { useContext, useMemo } from "react";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { parseVector } from "../utils";

export default createScene(
  ({ variables: { normal } }) => {
    const THREE = useContext(ThreeContext);
    const from = parseVector(THREE, [0, 2, 0]);
    const to = from.clone().add(normal);

    const mesh = new THREE.Mesh();
    mesh.lookAt(normal);
    const quat = mesh.quaternion;

    const points = useMemo(() => {
      const NX = 32;
      const NY = 22;

      const offsets: [number, number][] = [];
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          let x = -(NX / 2) + i;
          let y = -(NY / 2) + j;
          if (x === 0 && y === 0) continue;
          if (j % 2 === 0) x += 0.5;
          offsets.push([x, y]);
        }
      }

      return offsets
        .map(([x, y], i) => {
          const pos = new THREE.Vector3(x * 2, y * 1.7);
          const distance = Math.abs(x) + Math.abs(y);
          const radius = 0.033 - distance / 550;
          if (radius < 0) return null;
          return <Point key={i} color={0xaaaaaa} basicMaterial radius={radius} position={pos} />;
        })
        .filter(Boolean);
    }, []);

    return (
      <>
        <Vector color="blue" from={from} to={to} />
        <Point color="blue" position={from} />

        <mesh quaternion={quat} position={from}>
          {points}
        </mesh>

        <Plane color="blue" position={from} normal={normal} />
        <Grid size={10} />
      </>
    );
  },
  {
    variables: {
      normal: { label: "vec_n", type: "normal", value: [1, -1, 0.3] },
    },
  },
);
