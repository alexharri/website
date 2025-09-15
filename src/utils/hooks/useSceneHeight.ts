import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { SCENE_BASELINE_WIDTH } from "../../constants";
import { useSceneContext } from "../../contexts/CanvasContext";

export function useSceneHeight(targetHeight: number, options?: { minWidth?: number }) {
  const context = useSceneContext();
  const minWidth = options?.minWidth ?? (context ? context.minWidth : SCENE_BASELINE_WIDTH);

  const [width, setWidth] = useState(1000);
  const widthRef = useRef(width);
  widthRef.current = width;

  useIsomorphicLayoutEffect(() => {
    const onResize = () => {
      if (widthRef.current > minWidth && window.innerWidth > minWidth)
        return; // No value in rerendering
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [minWidth]);

  const scale = Math.min(1, width / minWidth);
  const height = Math.round(targetHeight * scale);
  return { height, scale };
}
