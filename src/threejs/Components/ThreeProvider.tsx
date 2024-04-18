import React, { useMemo, useRef, useState } from "react";
import { Drei, Fiber, Three } from "../types";

export const ThreeContext = React.createContext<Three>(null!);
export const DreiContext = React.createContext<Drei>(null!);
export const FiberContext = React.createContext<Fiber>(null!);
export const LoadThreeContext = React.createContext<{
  load: () => void;
  loaded: boolean;
  error: boolean;
}>({
  load: () => {
    throw new Error("Missing LoadThreeContext provider");
  },
  loaded: false,
  error: false,
});

export const ThreeProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const [three, setThree] = useState<Three | null>(null);
  const [drei, setDrei] = useState<Drei | null>(null);
  const [fiber, setFiber] = useState<Fiber | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const loaded = !!three;

  const loadContext = useMemo(
    () => ({
      async load() {
        if (loadingRef.current || three) return;

        setLoading(true);

        try {
          const [three, drei, fiber] = await Promise.all([
            import("three"),
            import("@react-three/drei"),
            import("@react-three/fiber"),
          ]);

          setThree(three);
          setDrei(drei);
          setFiber(fiber);
          setLoading(false);
        } catch (e) {
          console.error("Failed to load ThreeJS");
          console.log(e);
          setLoading(false);
          setError(true);
        }
      },
      loaded,
      loading,
      error,
    }),
    [three, drei, fiber, loading, loaded, error],
  );

  return (
    <LoadThreeContext.Provider value={loadContext}>
      <ThreeContext.Provider value={three!}>
        <DreiContext.Provider value={drei!}>
          <FiberContext.Provider value={fiber!}>{props.children}</FiberContext.Provider>
        </DreiContext.Provider>
      </ThreeContext.Provider>
    </LoadThreeContext.Provider>
  );
};
