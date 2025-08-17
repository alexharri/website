import React, { createContext, useContext, useRef, useMemo } from "react";
import { VariableDict } from "../types/variables";

type Variables = Record<string, unknown>;

interface ISceneContext {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrame: (buffer: Uint8Array) => void;
  height: number;
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
  onFrame: (buffer: Uint8Array) => void;
  height: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
}

export function CanvasProvider({
  children,
  onFrame,
  height,
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
      orbitControlsTargetRef,
      registerSceneVariables,
      variables,
    }),
    [onFrame, height, orbitControlsTargetRef, registerSceneVariables, variables],
  );

  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
}
