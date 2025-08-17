import React, { createContext, useContext, useRef } from "react";

interface CanvasContextValue {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrame: (buffer: Uint8Array) => void;
  height: number;
  orbitControlsTargetRef: React.RefObject<HTMLDivElement>;
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
}

export function CanvasProvider({
  children,
  onFrame,
  height,
  orbitControlsTargetRef,
}: CanvasProviderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const contextValue: CanvasContextValue = {
    canvasRef,
    onFrame,
    height,
    orbitControlsTargetRef,
  };

  return <CanvasContext.Provider value={contextValue}>{children}</CanvasContext.Provider>;
}
