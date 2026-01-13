import React, { createContext, useContext, useMemo } from "react";
import { VariableDict } from "../types/variables";
import { SCENE_BASELINE_WIDTH } from "../constants";

type Variables = Record<string, unknown>;

export type OnFrameOptions = { canvasWidth: number; canvasHeight: number };

export type OnFrameSource = { canvas: HTMLCanvasElement };

interface ISceneContext {
  onFrame: (source: OnFrameSource, options: OnFrameOptions) => void;
  width: number;
  height: number;
  minWidth: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  isPaused: boolean;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
  setNeverPause: (value: boolean) => void;
}

const SceneContext = createContext<ISceneContext | null>(null);

export function useSceneContext(): ISceneContext | null {
  return useContext(SceneContext);
}

interface CanvasProviderProps {
  children: React.ReactNode;
  onFrame: (source: OnFrameSource, options: OnFrameOptions) => void;
  width: number;
  height: number;
  minWidth?: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
  isPaused: boolean;
  setNeverPause: (value: boolean) => void;
}

export function SceneContextProvider({
  children,
  onFrame,
  width,
  height,
  minWidth,
  orbitControlsTargetRef,
  registerSceneVariables,
  variables,
  isPaused,
  setNeverPause,
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
      isPaused,
      setNeverPause,
    }),
    [
      onFrame,
      width,
      height,
      minWidth,
      orbitControlsTargetRef,
      registerSceneVariables,
      variables,
      isPaused,
      setNeverPause,
    ],
  );

  return <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>;
}
