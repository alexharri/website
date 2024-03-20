import { Cone, Sphere, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Euler, Matrix4, PerspectiveCamera, Vector3 } from "three";
import { StyleOptions, useStyles } from "../utils/styles";
import { Line } from "./Components/Line";
import { getBasicMaterial } from "./utils";

const firstUpper = (s: string) => s[0].toUpperCase() + s.slice(1);

export type NumberVariableSpec = {
  label?: string;
  type: "number";
  range: [number, number];
  value: number;
};

export type NormalVariableSpec = {
  label?: string;
  type: "normal";
  value: Vector3;
};

interface NumberVariableProps {
  dataKey: string;
  value: number;
  onValueChange: (value: number) => void;
  spec: NumberVariableSpec;
}

export const NumberVariable: React.FC<NumberVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange } = props;
  const [min, max] = spec.range;

  let svgLabel: string | undefined;

  if (spec.label) {
    const el = document.querySelector(`[data-varlabel="${spec.label}"]`);
    if (el) svgLabel = el.innerHTML;
  }

  return (
    <label>
      {svgLabel ? (
        <span style={{ fontSize: 24 }} dangerouslySetInnerHTML={{ __html: svgLabel }} />
      ) : (
        firstUpper(dataKey)
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value as number}
        onChange={(e) => onValueChange(Number(e.target.value))}
        step={0.1}
      />
    </label>
  );
};

const W = 100;

const styles = ({ styled }: StyleOptions) => ({
  normal: styled.css`
    width: ${W}px;
    height: ${W}px;
  `,

  axis: styled.css`
    width: ${W}px;
    height: ${W}px;
    border-radius: 50%;

    &--red {
      background: red;
    }
  `,
});

interface NormalVariableProps {
  dataKey: string;
  value: Vector3;
  onValueChange: (value: Vector3) => void;
  spec: NormalVariableSpec;
}

export const NormalVariable: React.FC<NormalVariableProps> = (props) => {
  const { dataKey, spec, value, onValueChange } = props;

  const s = useStyles(styles);

  let svgLabel: string | undefined;

  if (spec.label) {
    const el = document.querySelector(`[data-varlabel="${spec.label}"]`);
    if (el) svgLabel = el.innerHTML;
  }

  const hAngleRef = useRef(NaN);
  const vAngleRef = useRef(NaN);
  if (Number.isNaN(hAngleRef.current)) {
    const horizontal = value.clone();
    horizontal.y = 0;
    hAngleRef.current = new Vector3(0, 0, 1).angleTo(horizontal);
    if (value.x < 0) hAngleRef.current *= -1;
  }
  if (Number.isNaN(vAngleRef.current)) {
    vAngleRef.current = new Vector3(0, 1, 0).angleTo(value);
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const hAngle = hAngleRef.current;
    const vAngle = vAngleRef.current;

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX - startX;
      const y = e.clientY - startY;

      hAngleRef.current = hAngle + x / 100;
      vAngleRef.current = vAngle + y / 100;

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

  const euler = new Euler(Math.PI / 2 - vAngleRef.current, hAngleRef.current, 0, "YXZ");

  const camera = useMemo(() => {
    const camera = new PerspectiveCamera(30);
    camera.position.set(0, 0, 11);
    camera.lookAt(new Vector3(0, 0, 0));
    return camera;
  }, []);

  return (
    <label>
      {svgLabel ? (
        <span style={{ fontSize: 24 }} dangerouslySetInnerHTML={{ __html: svgLabel }} />
      ) : (
        firstUpper(dataKey)
      )}
      <div className={s("normal")} onMouseDown={onMouseDown}>
        <Canvas style={{ width: 100, height: 100 }} camera={camera}>
          <mesh rotation={euler}>
            <Cone
              args={[0.3, 0.5, 10]}
              position={[0, 0, -2.5]}
              material={getBasicMaterial("red")}
              rotation={[-Math.PI / 2, 0, 0]}
            />
            <Line from={[0, 0, 0]} to={[0, 0, -2.5]} radius={0.1} color="red" basicMaterial />
            <Torus args={[2, 0.05]} material={getBasicMaterial(0x008000)} />
            <Sphere material={getBasicMaterial("red")} args={[0.14]} />
            <Torus
              args={[1.95, 0.05]}
              material={getBasicMaterial(0x990000)}
              rotation={[0, Math.PI / 2, 0]}
            />
            <Torus
              args={[1.9, 0.05]}
              material={getBasicMaterial(0x0068ad)}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </mesh>
        </Canvas>
      </div>
    </label>
  );
};
