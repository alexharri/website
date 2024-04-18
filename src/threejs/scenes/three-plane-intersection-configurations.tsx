import { useContext, useRef } from "react";
import type THREE from "three";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { lerp } from "../../utils/lerp";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { FiberContext, ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";
import { getTransparentBasicMaterial } from "../utils";

export default createScene(
  ({ variables }) => {
    const THREE = useContext(ThreeContext);
    const FIBER = useContext(FiberContext);

    const n1 = new THREE.Vector3(1.3, 1, 0).normalize();
    const n2 = new THREE.Vector3(-1.3, 1, 0).normalize();
    const n3 = new THREE.Vector3(0, -1, 0).normalize();

    const p1 = new THREE.Vector3(0, 1.5, 0).add(n1.clone().multiplyScalar(0.7));
    const p2 = new THREE.Vector3(0, 1.5, 0).add(n2.clone().multiplyScalar(0.7));
    const p3 = new THREE.Vector3(0, 1.5, 0).add(n3.clone().multiplyScalar(0.7));

    const plane1 = PlaneClass.fromPointAndNormal(p1, n1);
    const plane2 = PlaneClass.fromPointAndNormal(p2, n2);
    const plane3 = PlaneClass.fromPointAndNormal(p3, n3);

    const i1 = planePlaneIntersection(plane1, plane2)!;
    const i2 = planePlaneIntersection(plane2, plane3)!;
    const i3 = planePlaneIntersection(plane3, plane1)!;

    const OFF = 12;

    const meshRef = useRef<THREE.Mesh | null>(null);
    const occludePlane0Ref = useRef<THREE.Mesh | null>(null);
    const occludePlane1Ref = useRef<THREE.Mesh | null>(null);

    const configurationRefs = Array.from({ length: 5 }).map(() => useRef<THREE.Mesh | null>(null));

    const posRef = useRef(variables.pos);
    posRef.current = variables.pos;

    const xRef = useRef(0);

    FIBER.useFrame(() => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const curr = mesh.position.x;
      const dest = -OFF * variables.pos;

      if (curr === dest) return;

      const x = Math.abs(curr - dest) < 0.01 ? dest : lerp(curr, dest, 0.1);
      mesh.position.setX(x);
    });

    const lastOffsetsRef = useRef([0, 0, 0, 0, 0]);

    FIBER.useFrame((state) => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const curr = xRef.current;
      const dest = OFF * posRef.current;

      const xShift = lerp(curr, dest, 0.15);
      mesh.position.setX(xShift);
      xRef.current = xShift;

      lastOffsetsRef.current;

      const lastOffsets = lastOffsetsRef.current;
      const cx = state.camera.position.x;
      for (const [i, ref] of configurationRefs.entries()) {
        if (!ref.current) continue;
        const x = -OFF * i;
        let xOff = 0;
        if (cx > 0 && i < posRef.current) {
          if (cx + 3.5 > x + xShift) xOff = cx + 3.5 - (x + xShift);
        } else if (i > posRef.current) {
          if (cx - 3.5 < x + xShift) xOff = cx - 3.5 - (x + xShift);
        }
        if (lastOffsets[i] !== xOff) {
          xOff = lerp(lastOffsets[i], xOff, 0.15);
          ref.current.position.setX(x + xOff);
          lastOffsets[i] = xOff;
        }
      }
    });

    FIBER.useFrame((state) => {
      const occludePlane0 = occludePlane0Ref.current;
      if (!occludePlane0) return;
      const occludePlane1 = occludePlane1Ref.current;
      if (!occludePlane1) return;

      occludePlane0.position.setX(Math.min(-OFF / 2, state.camera.position.x - 0.3));
      occludePlane1.position.setX(Math.max(OFF / 2, state.camera.position.x + 0.3));
    });

    return (
      <>
        <mesh
          position={[OFF / 2, 0, 0]}
          geometry={new THREE.BoxGeometry(0.01, 100, 100)}
          material={getTransparentBasicMaterial(THREE, "background")}
          ref={occludePlane0Ref}
        />
        <mesh
          position={[OFF / 2, 0, 0]}
          geometry={new THREE.BoxGeometry(0.01, 100, 100)}
          material={getTransparentBasicMaterial(THREE, "background")}
          ref={occludePlane1Ref}
        />
        <mesh
          position={[0, 0, OFF * 2]}
          geometry={new THREE.BoxGeometry(100, 100, 0.01)}
          material={getTransparentBasicMaterial(THREE, "background")}
        />
        <mesh
          position={[0, 0, -OFF * 2]}
          geometry={new THREE.BoxGeometry(100, 100, 0.01)}
          material={getTransparentBasicMaterial(THREE, "background")}
        />

        <mesh ref={meshRef}>
          <mesh ref={configurationRefs[0]}>
            <Plane normal={[0, 1, 0]} distance={3} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={2} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={1} color={0x888888} opacity={0.3} />
          </mesh>

          <mesh ref={configurationRefs[1]} position={[-OFF, 0, 0]}>
            <Plane normal={[1, 0, 0]} position={[0, 1.75, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={2.5} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={1} color={0x888888} opacity={0.3} />
            <Line from={[0, 1, -4]} to={[0, 1, 4]} color={0xff4444} radius={0.03} />
            <Line from={[0, 2.5, -4]} to={[0, 2.5, 4]} color={0xff4444} radius={0.03} />
          </mesh>

          <mesh ref={configurationRefs[2]} position={[-OFF * 2, 0, 0]}>
            <Plane normal={[1.3, 1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[-1.3, 1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, -1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Line from={[0, 1.5, -4]} to={[0, 1.5, 4]} color={0xff4444} radius={0.03} />
          </mesh>

          <mesh ref={configurationRefs[3]} position={[-OFF * 3, 0, 0]}>
            <Plane normal={n1} position={p1} color={0x888888} opacity={0.3} />
            <Plane normal={n2} position={p2} color={0x888888} opacity={0.3} />
            <Plane normal={n3} position={p3} color={0x888888} opacity={0.3} />
            {[i1, i2, i3].map(({ point }, i) => (
              <Line
                key={i}
                from={point.clone().add(new THREE.Vector3(0, 0, 4))}
                to={point.clone().add(new THREE.Vector3(0, 0, -4))}
                color={0xff4444}
                radius={0.03}
              />
            ))}
          </mesh>

          <mesh ref={configurationRefs[4]} position={[-OFF * 4, 0, 0]}>
            <Plane normal={[1, 0, 0]} position={[0, 2, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} position={[0, 2, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 0, 1]} position={[0, 2, 0]} color={0x888888} opacity={0.3} />
            <Point position={[0, 2, 0]} color={0xff4444} />
          </mesh>
        </mesh>
        <Grid light size={10} />
      </>
    );
  },
  {
    variables: {
      pos: { label: "Configuration", type: "number", value: 0, range: [0, 4], step: 1 },
    },
  },
);
