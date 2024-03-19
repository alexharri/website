import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Vector3 } from "three";
import { NumberVariable, NumberVariableSpec } from "./Variable";
import { StyleOptions, useStyles } from "../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  variablesWrapper: styled.css`
    display: flex;
    justify-content: center;
    gap: 16px;
  `,
});

type VariablesOptions = {
  [key: string]:
    | NumberVariableSpec
    | {
        label?: string;
        type: "normal";
        value: Vector3;
      };
};

type Variables<V extends VariablesOptions> = {
  [K in keyof V]: V[K]["value"];
};

interface SceneProps<V extends VariablesOptions> {
  camera: THREE.PerspectiveCamera;
  variables: Variables<V>;
}

interface Options<V extends VariablesOptions> {
  variables?: V;
}

const EMPTY_OBJ = {};

export function createScene<V extends VariablesOptions>(
  Component: React.FC<SceneProps<V>>,
  options: Options<V> = {},
) {
  return () => {
    const s = useStyles(styles);

    const [down, setDown] = useState(false);

    const camera = useMemo(() => {
      const camera = new THREE.PerspectiveCamera(40);
      camera.position.set(0, 7.5, -15);
      return camera;
    }, []);

    const variablesSpec = options.variables ?? (EMPTY_OBJ as V);
    const variableKeys = useMemo(() => Object.keys(variablesSpec), [variablesSpec]);

    const [variables, setVariables] = useState(() =>
      variableKeys.reduce((obj, _key) => {
        const key = _key as keyof V;
        obj[key] = variablesSpec[key].value;
        return obj;
      }, {} as Variables<V>),
    );

    const setVariableValue = (key: string, value: unknown) => {
      setVariables((obj) => ({ ...obj, [key]: value }));
    };

    return (
      <>
        <Canvas
          style={{ height: 500, userSelect: "none", cursor: down ? "grabbing" : "grab" }}
          camera={camera}
          onMouseDown={() => setDown(true)}
          onMouseUp={() => setDown(false)}
        >
          <ambientLight intensity={Math.PI / 2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            decay={0}
            intensity={Math.PI}
          />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

          <OrbitControls rotateSpeed={0.3} autoRotate enablePan={false} enableZoom={false} />

          <Component camera={camera} variables={variables} />
        </Canvas>

        <div className={s("variablesWrapper")}>
          {variableKeys.map((key) => {
            const spec = variablesSpec[key];
            const value = variables[key] as any;
            if (spec.type === "number")
              return (
                <NumberVariable
                  key={key}
                  dataKey={key}
                  value={value}
                  onValueChange={(value) => setVariableValue(key, value)}
                  spec={spec}
                />
              );

            return null;
          })}
        </div>
      </>
    );
  };
}
