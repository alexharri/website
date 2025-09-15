import React, { createContext, useContext, useRef, useMemo } from "react";
import { VariableDict } from "../types/variables";
import { SCENE_BASELINE_WIDTH } from "../constants";

type Variables = Record<string, unknown>;

export type OnFrameOptions = { flipY?: boolean };

interface ISceneContext {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrame: (buffer: Uint8Array, options?: OnFrameOptions) => void;
  height: number;
  minWidth: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
}

const SceneContext = createContext<ISceneContext | null>(null);

export function useSceneContext(): ISceneContext | null {
  return useContext(SceneContext);
}

interface CanvasProviderProps {
  children: React.ReactNode;
  onFrame: (buffer: Uint8Array, options?: OnFrameOptions) => void;
  height: number;
  minWidth?: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
}

export function CanvasProvider({
  children,
  onFrame,
  height,
  minWidth,
  orbitControlsTargetRef,
  registerSceneVariables,
  variables,
}: CanvasProviderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const contextValue: ISceneContext = useMemo(
    () => ({
      canvasRef,
      onFrame,
      height,
      minWidth: minWidth ?? SCENE_BASELINE_WIDTH,
      orbitControlsTargetRef,
      registerSceneVariables,
      variables,
    }),
    [onFrame, height, minWidth, orbitControlsTargetRef, registerSceneVariables, variables],
  );

  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
}
