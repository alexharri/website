import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { NumberVariable } from "../components/variables";
import { NormalVariable } from "./NormalVariable";
import { StyleOptions, useStyles } from "../utils/styles";
import { useDidUpdate } from "../utils/hooks/useDidUpdate";
import { DreiContext, FiberContext, ThreeContext } from "./Components/ThreeProvider";
import { useSceneHeight } from "../utils/hooks/useSceneHeight";
import { SceneProps } from "./scenes";
import { FrameReader } from "./Components/FrameReader";
import { VariableDict } from "../types/variables";
import { useSceneContext } from "../contexts/CanvasContext";

const FADE_HEIGHT = 80;

const styles = ({ styled, theme }: StyleOptions) => ({
  variablesWrapper: styled.css`
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    gap: 32px;
    height: 72px;
    padding-bottom: 16px;
    align-items: center;
    margin-top: -16px;
  `,

  fade: styled.css`
    z-index: 1;
    position: absolute;
    left: 0;
    right: 0;
    background: linear-gradient(${theme.background}, rgba(${theme.backgroundRgb}, 0));
    pointer-events: none;

    &--upper {
      top: 0;
    }
    &--lower {
      bottom: 0;
      transform: rotate(180deg);
    }
  `,
});

type LocalVariables<V extends VariableDict> = {
  [K in keyof V]: V[K]["value"] extends [number, number, number] ? THREE.Vector3 : V[K]["value"];
};

interface SceneComponentProps<V extends VariableDict> {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  variables: LocalVariables<V>;
}

interface Options<V extends VariableDict> {
  variables?: V;
}

const EMPTY_OBJ = {};

const DEG_TO_RAD = Math.PI / 180;

export function createScene<V extends VariableDict>(
  Component: React.FC<SceneComponentProps<V>>,
  options: Options<V> = {},
) {
  return ({
    scene,
    visible,
    height: targetHeight,
    usesVariables,
    autoRotate,
    angle = 20,
    yOffset = 0,
    xRotation = 0,
    zoom = 1,
    onFrame,
    orbitControlsRef: externalOrbitControlsRef,
    orbitControlsTargetRef,
  }: SceneProps) => {
    const THREE = useContext(ThreeContext);
    const DREI = useContext(DreiContext);
    const FIBER = useContext(FiberContext);
    const context = useSceneContext();

    useEffect(() => {
      const variableKeys = Object.keys(options.variables || {});
      if (variableKeys.length > 0 && !usesVariables) {
        console.log(`Scene '${scene}' uses variables`);
      } else if (variableKeys.length === 0 && usesVariables) {
        console.log(`Scene '${scene}' does not use variables`);
      }
    }, []);

    const s = useStyles(styles);

    const [down, setDown] = useState(false);

    const threeScene = useMemo(() => {
      return new THREE.Scene();
    }, [visible]);

    const camera = useMemo(() => {
      const scale = 1 - (targetHeight / 500) * 0.13;
      const fov = targetHeight / 10;
      const camera = new THREE.PerspectiveCamera(fov);

      const dist = -16.8;
      const angleRad = angle * DEG_TO_RAD;
      const xRotationRad = xRotation * DEG_TO_RAD;
      const rot = new THREE.Euler(angleRad, xRotationRad, 0, "YXZ");
      const pos = new THREE.Vector3(0, 0, dist);
      pos.applyEuler(rot);
      pos.multiplyScalar(scale);
      pos.multiplyScalar(1 / zoom);
      camera.position.set(pos.x, pos.y, pos.z);
      return camera;
    }, [visible]);

    const variablesSpec = useMemo(() => options.variables ?? (EMPTY_OBJ as V), [options.variables]);
    const variableKeys = useMemo(() => Object.keys(variablesSpec), [variablesSpec]);

    const [variables, setVariables] = useState(() =>
      variableKeys.reduce((obj, _key) => {
        const key = _key as keyof V;
        obj[key] = (
          Array.isArray(variablesSpec[key].value)
            ? new THREE.Vector3(
                ...(variablesSpec[key].value as [number, number, number]),
              ).normalize()
            : (variablesSpec[key].value as number)
        ) as LocalVariables<V>[typeof key];
        return obj;
      }, {} as LocalVariables<V>),
    );

    // Register variables with context if available
    useEffect(() => {
      if (context?.registerSceneVariables && variableKeys.length > 0) {
        context.registerSceneVariables(variablesSpec);
      }
    }, [context?.registerSceneVariables, variableKeys.length]);

    const [rotate, setRotate] = useState(true);

    const timeoutRef = useRef<number>();
    useDidUpdate(() => {
      window.clearTimeout(timeoutRef.current);
      setRotate(false);
      timeoutRef.current = window.setTimeout(() => setRotate(true), 1500);
    }, [variables]);

    const setVariableValue = (key: string, value: unknown) => {
      setVariables((obj) => ({ ...obj, [key]: value }));
    };

    const orbitRef = externalOrbitControlsRef || useRef<any>(null);

    const rotationCallbacks = useRef(new Set<(vec: THREE.Camera) => void>());

    useEffect(() => {
      if (!visible) return;

      let stopped = false;
      const tick = () => {
        if (!stopped) requestAnimationFrame(tick);
        for (const rotationCallback of rotationCallbacks.current) {
          rotationCallback(camera);
        }
      };
      requestAnimationFrame(tick);
      return () => {
        stopped = true;
      };
    }, [camera, visible]);

    const hasNormal = variableKeys.some((key) => variablesSpec[key].type === "normal");

    const { height, scale } = useSceneHeight(targetHeight);
    const fadeHeight = Math.round(FADE_HEIGHT * scale);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const S = 1;

    return (
      <>
        <div style={{ position: "relative", height }}>
          {!context && (
            <>
              <div className={s("fade", { upper: true })} style={{ height: fadeHeight }} />
              <div className={s("fade", { lower: true })} style={{ height: fadeHeight }} />
            </>
          )}

          {visible && (
            <FIBER.Canvas
              shadows
              onCreated={({ gl }) => {
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
                canvasRef.current?.setAttribute("data-ready", "true");
              }}
              gl={{ preserveDrawingBuffer: true }}
              style={{
                height: height * S,
                width: 100 * S + "%",
                userSelect: "none",
                cursor: down ? "grabbing" : "grab",
              }}
              scene={threeScene}
              camera={camera}
              onMouseDown={() => setDown(true)}
              onMouseUp={() => setDown(false)}
              resize={{ scroll: false }}
              ref={canvasRef}
            >
              {onFrame && <FrameReader onFrame={onFrame} />}
              {/* <ambientLight intensity={Math.PI / 2} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                decay={0}
                intensity={Math.PI}
              />
              <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> */}

              <DREI.OrbitControls
                rotateSpeed={0.3}
                enableRotate
                autoRotate={rotate && autoRotate}
                autoRotateSpeed={0.7}
                enablePan={false}
                enableZoom={false}
                ref={orbitRef}
                domElement={orbitControlsTargetRef?.current || undefined}
              />

              <mesh position={[0, yOffset, 0]}>
                <Component camera={camera} variables={variables} scene={threeScene} />
              </mesh>
            </FIBER.Canvas>
          )}
        </div>

        {variableKeys.length > 0 && !context?.registerSceneVariables && (
          <div className={s("variablesWrapper", { hasNormal })}>
            {variableKeys.map((key) => {
              const spec = variablesSpec[key];
              const value = variables[key];
              if (spec.type === "number")
                return (
                  <NumberVariable
                    key={key}
                    dataKey={key}
                    value={value as number}
                    onValueChange={(value) => setVariableValue(key, value)}
                    spec={spec}
                    showValue={false}
                  />
                );
              if (spec.type === "normal") {
                return (
                  <NormalVariable
                    key={key}
                    dataKey={key}
                    value={value as THREE.Vector3}
                    onValueChange={(value) => setVariableValue(key, value)}
                    spec={spec}
                    visible={visible}
                    addRotationCallback={(fn) => rotationCallbacks.current.add(fn)}
                    removeRotationCallback={(fn) => rotationCallbacks.current.delete(fn)}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </>
    );
  };
}
