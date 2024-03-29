import React, { useMemo, useRef, useState } from "react";
import { Drei, Fiber, Three } from "../types";

export const ThreeContext = React.createContext<Three>(null!);
export const DreiContext = React.createContext<Drei>(null!);
export const FiberContext = React.createContext<Fiber>(null!);
export const LoadThreeContext = React.createContext<{ load: () => void; loaded: boolean }>({
  load: () => {
    throw new Error("Missing LoadThreeContext provider");
  },
  loaded: false,
});

export const ThreeProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const [three, setThree] = useState<Three | null>(null);
  const [drei, setDrei] = useState<Drei | null>(null);
  const [fiber, setFiber] = useState<Fiber | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

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
          // TODO: better error handling
          console.error("Failed to import ThreeJS");
          console.log(e);
          setLoading(false);
        }
      },
      loaded: !!three,
      loading,
    }),
    [three, drei, fiber],
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
