import React, { createContext, useContext, useMemo } from "react";
import { VariableDict } from "../types/variables";
import { SCENE_BASELINE_WIDTH } from "../constants";

type Variables = Record<string, unknown>;

export type OnFrameOptions = { flipY?: boolean; canvasWidth: number };

interface ISceneContext {
  onFrame: (buffer: Uint8Array, options: OnFrameOptions) => void;
  width: number;
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
  onFrame: (buffer: Uint8Array, options: OnFrameOptions) => void;
  width: number;
  height: number;
  minWidth?: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
}

export function CanvasProvider({
  children,
  onFrame,
  width,
  height,
  minWidth,
  orbitControlsTargetRef,
  registerSceneVariables,
  variables,
}: CanvasProviderProps) {
  const contextValue: ISceneContext = useMemo(
    () => ({
      onFrame,
      width,
      height,
      minWidth: minWidth ?? SCENE_BASELINE_WIDTH,
      orbitControlsTargetRef,
      registerSceneVariables,
      variables,
    }),
    [onFrame, width, height, minWidth, orbitControlsTargetRef, registerSceneVariables, variables],
  );

  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
}
