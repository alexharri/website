import { useContext, useRef } from "react";
import type { Mesh } from "three";
import { Plane as PlaneClass } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/PlanePlaneIntersection";
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

    const OFF = 16.5;

    const meshRef = useRef<Mesh | null>(null);
    const t0Ref = useRef<Mesh | null>(null);
    const t1Ref = useRef<Mesh | null>(null);

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

    FIBER.useFrame(() => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const curr = xRef.current;
      const dest = OFF * posRef.current;

      const x = lerp(curr, dest, 0.15);
      mesh.position.setX(x);
      xRef.current = x;
    });

    FIBER.useFrame((state) => {
      const t0 = t0Ref.current;
      if (!t0) return;
      const t1 = t1Ref.current;
      if (!t1) return;

      t0.position.setX(Math.min(-OFF / 2, state.camera.position.x - 1));
      t1.position.setX(Math.max(OFF / 2, state.camera.position.x + 1));
    });

    return (
      <>
        <mesh
          position={[OFF / 2, 0, 0]}
          geometry={new THREE.BoxGeometry(0.01, 100, 100)}
          material={getTransparentBasicMaterial(THREE, "background")}
          ref={t0Ref}
        />
        <mesh
          position={[OFF / 2, 0, 0]}
          geometry={new THREE.BoxGeometry(0.01, 100, 100)}
          material={getTransparentBasicMaterial(THREE, "background")}
          ref={t1Ref}
        />
        <mesh
          position={[0, 0, OFF]}
          geometry={new THREE.BoxGeometry(100, 100, 0.01)}
          material={getTransparentBasicMaterial(THREE, "background")}
        />
        <mesh
          position={[0, 0, -OFF]}
          geometry={new THREE.BoxGeometry(100, 100, 0.01)}
          material={getTransparentBasicMaterial(THREE, "background")}
        />

        <mesh ref={meshRef}>
          <mesh>
            <Plane normal={[0, 1, 0]} distance={3} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={2} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={1} color={0x888888} opacity={0.3} />
          </mesh>

          <mesh position={[-OFF, 0, 0]}>
            <Plane normal={[1, 0, 0]} position={[0, 1.75, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={2.5} color={0x888888} opacity={0.3} />
            <Plane normal={[0, 1, 0]} distance={1} color={0x888888} opacity={0.3} />
            <Line from={[0, 1, -4]} to={[0, 1, 4]} color={0xff4444} radius={0.03} />
            <Line from={[0, 2.5, -4]} to={[0, 2.5, 4]} color={0xff4444} radius={0.03} />
          </mesh>

          <mesh position={[-OFF * 2, 0, 0]}>
            <Plane normal={[1.3, 1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[-1.3, 1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Plane normal={[0, -1, 0]} position={[0, 1.5, 0]} color={0x888888} opacity={0.3} />
            <Line from={[0, 1.5, -4]} to={[0, 1.5, 4]} color={0xff4444} radius={0.03} />
          </mesh>

          <mesh position={[-OFF * 3, 0, 0]}>
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

          <mesh position={[-OFF * 4, 0, 0]}>
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
