import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../utils/hooks/useIsomorphicLayoutEffect";

export function useSceneHeight(targetHeight: number) {
  const [width, setWidth] = useState(1000); //
  const widthRef = useRef(width);
  widthRef.current = width;

  useIsomorphicLayoutEffect(() => {
    const onResize = () => {
      if (widthRef.current > 600 && window.innerWidth > 600) return; // No value in rerendering
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale = Math.min(1, width / 600);
  const height = Math.round(targetHeight * scale);
  return { height, scale };
}
