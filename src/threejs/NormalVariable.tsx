import { Cone, Sphere, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Matrix4, Mesh, PerspectiveCamera, Vector3, Camera } from "three";
import { useStyles } from "../utils/styles";
import { Line } from "./Components/Line";
import NormalVariableStyles from "./NormalVariable.styles";
import { getBasicMaterial } from "./utils";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

export type NormalVariableSpec = {
  label?: string;
  type: "normal";
  value: Vector3;
};

interface NormalVariableProps {
  dataKey: string;
  value: Vector3;
  onValueChange: (value: Vector3) => void;
  spec: NormalVariableSpec;
  visible: boolean;
  addRotationCallback: (callback: (rotation: Camera) => void) => void;
  removeRotationCallback: (callback: (rotation: Camera) => void) => void;
}

function parseHAngle(normal: Vector3) {
  const horizontal = normal.clone();
  horizontal.y = 0;
  let out = new Vector3(0, 0, 1).angleTo(horizontal);
  if (normal.x < 0) out *= -1;
  return out;
}
function parseVAngle(normal: Vector3) {
  return new Vector3(0, 1, 0).angleTo(normal);
}

export const NormalVariable: React.FC<NormalVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange, visible } = props;

  const s = useStyles(NormalVariableStyles);

  let svgLabel: string | undefined;

  if (spec.label) {
    const el = document.querySelector(`[data-varlabel="${spec.label}"]`);
    if (el) svgLabel = el.innerHTML;
  }

  const hAngleRef = useRef(NaN);
  const vAngleRef = useRef(NaN);
  if (Number.isNaN(hAngleRef.current)) hAngleRef.current = parseHAngle(value);
  if (Number.isNaN(vAngleRef.current)) vAngleRef.current = parseVAngle(value);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const hAngle = hAngleRef.current;
    const vAngle = vAngleRef.current;

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX - startX;
      const y = e.clientY - startY;

      hAngleRef.current = hAngle - x / 100;
      vAngleRef.current = vAngle + y / 170;

      const epsilon = 0.00001;
      vAngleRef.current = Math.max(epsilon, Math.min(Math.PI - epsilon, vAngleRef.current));

      const ry = new Matrix4().makeRotationX(vAngleRef.current);
      const rx = new Matrix4().makeRotationY(hAngleRef.current);
      const nextValue = new Vector3(0, 1, 0).applyMatrix4(ry).applyMatrix4(rx);
      onValueChange(nextValue);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const camera = useMemo(() => {
    const camera = new PerspectiveCamera(35);
    camera.position.set(0, 0, 9);
    camera.lookAt(new Vector3(0, 0, 0));
    return camera;
  }, []);

  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    const callback = (_camera: Camera) => {
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

  return (
    <label className={s("normalLabel")}>
      {svgLabel ? (
        <span style={{ fontSize: 24 }} dangerouslySetInnerHTML={{ __html: svgLabel }} />
      ) : (
        firstUpper(dataKey)
      )}
      <div className={s("normal")} onMouseDown={onMouseDown}>
        <Canvas camera={camera}>
          {visible && (
            <mesh ref={meshRef}>
              <mesh
                rotation={[Math.PI / 2 - vAngleRef.current, hAngleRef.current + Math.PI, 0, "YXZ"]}
              >
                <Cone
                  args={[0.3, 0.5, 10]}
                  position={[0, 0, -2.5]}
                  material={getBasicMaterial("red")}
                  rotation={[-Math.PI / 2, 0, 0]}
                />
                <Line from={[0, 0, 0]} to={[0, 0, -2.5]} radius={0.1} color="red" basicMaterial />
                <Torus args={[TORUS_R, TORUS_W]} material={getBasicMaterial(0x008000)} />
                <Sphere material={getBasicMaterial("red")} args={[0.14]} />
                <Torus
                  args={[TORUS_R - TORUS_OFF, TORUS_W]}
                  material={getBasicMaterial(0x990000)}
                  rotation={[0, Math.PI / 2, 0]}
                />
                <Torus
                  args={[TORUS_R - TORUS_OFF * 2, TORUS_W]}
                  material={getBasicMaterial(0x0068ad)}
                  rotation={[Math.PI / 2, 0, 0]}
                />
              </mesh>
            </mesh>
          )}
        </Canvas>
      </div>
    </label>
  );
};
