import React, { useMemo } from "react";
import { createNoise2D } from "simplex-noise";
import { createScene } from "../createScene";
import { Point } from "../Components/primitives/Point";

export default createScene(({}) => {
  const simplex_noise2D = useMemo(() => createNoise2D(), []);

  const points = useMemo(() => {
    const NX = 40;
    const NY = 40;

    const points: React.ReactNode[] = [];

    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NY; j++) {
        let x = -(NX / 2) + i;
        let z = -(NY / 2) + j;
        points.push(
          <Point
            key={[i, j].join(",")}
            color={0x2e6db0}
            basicMaterial
            radius={0.029}
            position={[x * 0.3, 1.3 + simplex_noise2D(x * 0.05, z * 0.05) * 0.7, z * 0.3]}
          />,
        );
      }
    }
    return points;
  }, []);

  return <>{points}</>;
});
