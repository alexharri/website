import { useContext, useMemo, useRef } from "react";
import type * as THREE from "three";
import { createScene } from "../createScene";
import { ThreeContext, FiberContext } from "../Components/ThreeProvider";
import { backOut, cubicInOut, expoInOut, fit } from "../../math/easing";

export default createScene(
  ({ scene }) => {
    const THREE = useContext(ThreeContext);
    const FIBER = useContext(FiberContext);

    // Set background color
    scene.background = new THREE.Color(0x494949);

    // Refs for animation targets
    const logoContainerRef = useRef<THREE.Group>(null);
    const topRowRef = useRef<THREE.Group>(null);
    const bottomRowRef = useRef<THREE.Group>(null);
    const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(12).fill(null));
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const startTimeRef = useRef(Date.now());

    // Geometry and materials
    const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [THREE]);
    const material = useMemo(
      () =>
        new THREE.MeshPhongMaterial({
          color: 0x4a6280, // Darker blue-grey, closer to original
          shininess: 30,
          specular: 0x222222,
        }),
      [THREE],
    );

    // Animation loop
    FIBER.useFrame(() => {
      const t = (Date.now() - startTimeRef.current) / 1000;

      // Mesh scale animation (12 meshes with stagger)
      meshRefs.current.forEach((mesh, i) => {
        if (!mesh) return;
        const offset = i * 0.05 - Math.floor(i / 3) * 0.05;
        const scale = fit(t, offset, offset + 0.5, 0, 1, backOut);
        mesh.scale.setScalar(scale);
      });

      // Top row animation
      if (topRowRef.current) {
        topRowRef.current.position.x = fit(t, 0, 1, 2, 0, cubicInOut);
        topRowRef.current.rotation.y = fit(t, 0, 1, -Math.PI / 2, 0, cubicInOut);
      }

      // Bottom row animation
      if (bottomRowRef.current) {
        bottomRowRef.current.position.x = fit(t, 0.25, 1.25, -2, 0, cubicInOut);
        bottomRowRef.current.rotation.y = fit(t, 0.25, 1.25, Math.PI / 2, 0, cubicInOut);
      }

      // Continuous rotation (after assembly)
      if (logoContainerRef.current && t > 3) {
        const rotTime = t - 3;
        const progress = fit(rotTime % 5, 0.5, 2, 0, 1, expoInOut);
        const angle = (Math.PI / 2) * progress;
        logoContainerRef.current.rotation.set(angle, angle, angle);
      }
    });

    // Helper to create a cube part with 3 meshes
    const createPart = (startIndex: number) => (
      <>
        {/* Front mesh */}
        <group position-z={-1} scale={0.9}>
          <mesh
            ref={(el) => {
              meshRefs.current[startIndex] = el;
            }}
            geometry={boxGeometry}
            material={material}
          />
        </group>

        {/* Connector mesh */}
        <group scale={[0.2, 0.2, 2]}>
          <mesh
            ref={(el) => {
              meshRefs.current[startIndex + 1] = el;
            }}
            geometry={boxGeometry}
            material={material}
          />
        </group>

        {/* Back mesh */}
        <group position-z={1} scale={0.9}>
          <mesh
            ref={(el) => {
              meshRefs.current[startIndex + 2] = el;
            }}
            geometry={boxGeometry}
            material={material}
          />
        </group>
      </>
    );

    return (
      <>
        {/* Lighting - minimal ambient for dramatic effect like heroascii.js */}
        <ambientLight intensity={0.85} />

        {/* Single interactive directional light */}
        <directionalLight intensity={30.0} position={[450, 800, 330]} />

        {/* Logo structure */}
        <group position={[0.35, 0, 0]} rotation={[-0.6, Math.PI * 0.25, 0]} scale={300}>
          <group ref={logoContainerRef} scale={0.38}>
            {/* Top row */}
            <group ref={topRowRef} position-y={1}>
              {/* Left part */}
              <group position-x={-1}>{createPart(0)}</group>

              {/* Right part */}
              <group position-x={1}>{createPart(3)}</group>
            </group>

            {/* Bottom row */}
            <group ref={bottomRowRef} position-y={-1}>
              {/* Left part (rotated) */}
              <group position-z={-1} rotation-y={Math.PI / 2}>
                {createPart(6)}
              </group>

              {/* Right part (rotated) */}
              <group position-z={1} rotation-y={Math.PI / 2}>
                {createPart(9)}
              </group>
            </group>
          </group>
        </group>
      </>
    );
  },
  {
    createCamera: (THREE) => {
      // Orthographic camera with proper frustum for scaled geometry
      const aspect = 1;
      const camera = new THREE.OrthographicCamera(
        -aspect,
        aspect,
        1,
        -1,
        0.5, // Near plane (can see behind camera)
        1000, // Far plane
      );
      camera.position.z = 400;
      return camera;
    },
    customLights: true,
  },
);
