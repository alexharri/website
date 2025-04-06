import React, { useContext, useMemo, useRef } from "react";
import { createNoise2D } from "simplex-noise";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { useFrame } from "@react-three/fiber";
import { getBasicMaterial, parseVector } from "../utils";
import { colors } from "../../utils/cssVariables";
import { hexToBinary } from "../../utils/color";
import { Plane } from "../Components/primitives/Plane";
import { clamp } from "../../math/math";
import { MathLabel } from "../Components/primitives/MathLabel";
import { Vector } from "../Components/primitives/Vector";

const Xrange = 8;
const Zrange = 14;
const NX = 120;
const NZ = 20;

export default createScene(({ scene }) => {
  const THREE = useContext(ThreeContext);
  const simplex_noise2D = useMemo(() => createNoise2D(), []);

  const offsets = useMemo(() => {
    const offsets: [number, number][] = [];
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NZ; j++) {
        let x = (-(NX / 2) + i) / NX;
        let z = j;
        offsets.push([x, z]);
      }
    }
    return offsets;
  }, []);

  const zGroups = useMemo(() => {
    const zGroups = Array.from({ length: NZ }).map((_, zOff) => {
      const group = new THREE.Group();
      const z = zOff / NZ - 0.5;
      group.position.set(0, 0, z * Zrange);
      scene.add(group);
      return group;
    });

    const spereGeometry = new THREE.SphereGeometry(0.05, 10, 10);
    const sphereMaterial = getBasicMaterial(THREE, hexToBinary(colors.text));
    for (const [xOff, zOff] of offsets) {
      const mesh = new THREE.Mesh(spereGeometry, sphereMaterial);
      mesh.position.set(xOff * Xrange, 0, 0);
      mesh.scale.set(0, 0, 0);
      const group = zGroups[zOff];
      group.add(mesh);
    }
    return zGroups;
  }, [scene, offsets]);

  const startTimeRef = useRef(Date.now());
  const lastZStepsRef = useRef(Array.from({ length: NZ }).fill(NaN));

  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const evolution = elapsed * 0.15;

    for (let zOff = 0; zOff < NZ; zOff++) {
      const zGroup = zGroups[zOff];
      const z_t = zOff / NZ;
      const z_ev = z_t + evolution + 0.5;
      const z_rem = z_ev % 1;
      const z_pos = (z_rem - 0.5) * Zrange;
      const edgeDist = Math.min(1 - z_rem, z_rem);
      const midDist = Math.abs(z_rem - 0.5 + 0.01);
      // prettier-ignore
      let scale = 0
        + clamp(edgeDist * 1.4, 0, 0.4)
        + clamp(1 - midDist * 29, 0, 0.6)
        - clamp(Math.max(0, z_pos * 0.5), 0, 0.225);
      scale = Math.max(scale, 0);

      // Update Z position of group
      zGroup.position.z = z_pos;
      // Update scale of points within group
      for (const mesh of zGroup.children) {
        mesh.scale.set(scale, scale, scale);
      }

      // Only update Y when we need to
      const zStep = Math.floor(z_ev) - z_t;
      if (zStep !== lastZStepsRef.current[zOff]) {
        lastZStepsRef.current[zOff] = zStep;
        for (const mesh of zGroup.children) {
          const y = simplex_noise2D(mesh.position.x * 0.1, zStep);
          mesh.position.y = y * 1.1;
        }
      }
    }
  });

  return (
    <>
      <Plane normal={[0, 0, 1]} color="white" width={Xrange} />
      {[1, -1].map((sign) => {
        const vpos = parseVector(THREE, [(Xrange / 2 + 2) * sign, 1, 0]);
        return (
          <React.Fragment key={sign}>
            <MathLabel
              label="time"
              position={vpos.clone().add(parseVector(THREE, [0.15 * sign, 0.7, 0]))}
              normal={[1 * sign, -0.3, 0]}
              autoScale={false}
            />
            <Vector
              to={vpos.clone().add(parseVector(THREE, [0, 0, -1]))}
              from={vpos.clone().add(parseVector(THREE, [0, 0, 1]))}
              color="white"
            />
          </React.Fragment>
        );
      })}
    </>
  );
});
