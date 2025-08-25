import { useContext, useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { useStyles } from "../utils/styles";
import { Line } from "./Components/primitives/Line";
import { DreiContext, FiberContext, ThreeContext } from "./Components/ThreeProvider";
import { MathSVG } from "../components/variables";
import NormalVariableStyles from "./NormalVariable.styles";
import { Three } from "./types";
import { getBasicMaterial } from "./utils";
import { NormalVariableSpec } from "../types/variables";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

export type { NormalVariableSpec } from "../types/variables";

interface NormalVariableProps {
  dataKey: string;
  value: THREE.Vector3;
  onValueChange: (value: THREE.Vector3) => void;
  spec: NormalVariableSpec;
  visible: boolean;
  addRotationCallback: (callback: (rotation: THREE.Camera) => void) => void;
  removeRotationCallback: (callback: (rotation: THREE.Camera) => void) => void;
}

function parseHAngle(THREE: Three, normal: THREE.Vector3) {
  const horizontal = normal.clone();
  horizontal.y = 0;
  let out = new THREE.Vector3(0, 0, 1).angleTo(horizontal);
  if (normal.x < 0) out *= -1;
  return out;
}

function parseVAngle(THREE: Three, normal: THREE.Vector3) {
  return new THREE.Vector3(0, 1, 0).angleTo(normal);
}

export const NormalVariable: React.FC<NormalVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange, visible } = props;

  const THREE = useContext(ThreeContext);
  const DREI = useContext(DreiContext);
  const FIBER = useContext(FiberContext);
  const s = useStyles(NormalVariableStyles);

  const svgLabel = useMemo(() => {
    if (spec.label && spec.label.startsWith("math:")) {
      const [_, label] = spec.label.split("math:");
      return <MathSVG label={label} />;
    }
    return null;
  }, [spec.label]);

  const hAngleRef = useRef(NaN);
  const vAngleRef = useRef(NaN);
  if (Number.isNaN(hAngleRef.current)) hAngleRef.current = parseHAngle(THREE, value);
  if (Number.isNaN(vAngleRef.current)) vAngleRef.current = parseVAngle(THREE, value);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    document.body.classList.add("grabbing");

    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const hAngle = hAngleRef.current;
    const vAngle = vAngleRef.current;

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - startX;
      const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - startY;

      hAngleRef.current = hAngle - x / 100;
      vAngleRef.current = vAngle + y / 170;

      const epsilon = 0.00001;
      vAngleRef.current = Math.max(epsilon, Math.min(Math.PI - epsilon, vAngleRef.current));

      const ry = new THREE.Matrix4().makeRotationX(vAngleRef.current);
      const rx = new THREE.Matrix4().makeRotationY(hAngleRef.current);
      const nextValue = new THREE.Vector3(0, 1, 0).applyMatrix4(ry).applyMatrix4(rx);
      onValueChange(nextValue);
    };

    const onMouseUp = () => {
      document.body.classList.remove("grabbing");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
  };

  const camera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(35);
    camera.position.set(0, 0, 9);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const callback = (_camera: THREE.Camera) => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const scalar = camera.position.length() / _camera.position.length();
      const nextPos = _camera.position.clone().multiplyScalar(scalar);
      camera.position.set(nextPos.x, nextPos.y, nextPos.z);
      camera.lookAt(0, 0, 0);
    };
    props.addRotationCallback(callback);
    return () => {
      props.removeRotationCallback(callback);
    };
  }, []);

  const TORUS_R = 1.8;
  const TORUS_OFF = 0.05;
  const TORUS_W = 0.05;

  const torus = useMemo(
    () => (
      <>
        <DREI.Cone
          args={[0.3, 0.5, 10]}
          position={[0, 0, -2.5]}
          material={getBasicMaterial(THREE, "red")}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <Line from={[0, 0, 0]} to={[0, 0, -2.5]} radius={0.1} color="red" basicMaterial />
        <DREI.Torus args={[TORUS_R, TORUS_W]} material={getBasicMaterial(THREE, 0x008000)} />
        <DREI.Sphere material={getBasicMaterial(THREE, "red")} args={[0.14]} />
        <DREI.Torus
          args={[TORUS_R - TORUS_OFF, TORUS_W]}
          material={getBasicMaterial(THREE, 0x990000)}
          rotation={[0, Math.PI / 2, 0]}
        />
        <DREI.Torus
          args={[TORUS_R - TORUS_OFF * 2, TORUS_W]}
          material={getBasicMaterial(THREE, 0x0068ad)}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </>
    ),
    [THREE, DREI],
  );

  return (
    <label className={s("normalLabel")}>
      {svgLabel || firstUpper(spec.label ?? dataKey)}
      <div className={s("normal")} onMouseDown={onMouseDown} onTouchStart={onMouseDown}>
        <FIBER.Canvas camera={camera}>
          {visible && (
            <mesh ref={meshRef}>
              <mesh
                rotation={[Math.PI / 2 - vAngleRef.current, hAngleRef.current + Math.PI, 0, "YXZ"]}
              >
                {torus}
              </mesh>
            </mesh>
          )}
        </FIBER.Canvas>
      </div>
    </label>
  );
};
