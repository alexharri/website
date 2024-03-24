import React, { useMemo, useRef, useState } from "react";
import { Drei, Three } from "../types";

export const ThreeContext = React.createContext<Three>(null!);
export const DreiContext = React.createContext<Drei>(null!);
export const LoadThreeContext = React.createContext<{ load: () => void; loaded: boolean }>({
  load: () => {
    throw new Error("Missing LoadThreeContext provider");
  },
  loaded: false,
});

export const ThreeProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const [three, setThree] = useState<Three | null>(null);
  const [drei, setDrei] = useState<Drei | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const loadContext = useMemo(
    () => ({
      async load() {
        if (loadingRef.current) return;

        setLoading(true);

        try {
          const [three, drei] = await Promise.all([import("three"), import("@react-three/drei")]);

          setThree(three);
          setDrei(drei);
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
    [three, drei],
  );

  console.log({ three, drei, loading });

  return (
    <LoadThreeContext.Provider value={loadContext}>
      <ThreeContext.Provider value={three!}>
        <DreiContext.Provider value={drei!}>{props.children}</DreiContext.Provider>
      </ThreeContext.Provider>
    </LoadThreeContext.Provider>
  );
};
