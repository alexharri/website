import React, { createContext, useContext, useRef, useMemo } from "react";
import { VariableDict } from "../types/variables";

type Variables = Record<string, unknown>;

interface CanvasContextValue {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrame: (buffer: Uint8Array) => void;
  height: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
  registerSceneVariables?: (specs: VariableDict) => void;
  variables?: Variables;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvasContext(): CanvasContextValue | null {
  const context = useContext(CanvasContext);
  return context;
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

  const contextValue: CanvasContextValue = useMemo(
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

  return <CanvasContext.Provider value={contextValue}>{children}</CanvasContext.Provider>;
}
