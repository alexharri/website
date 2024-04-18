import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../utils/hooks/useIsomorphicLayoutEffect";
import { SCENE_BASELINE_WIDTH } from "./constants";

export function useSceneHeight(targetHeight: number) {
  const [width, setWidth] = useState(1000);
  const widthRef = useRef(width);
  widthRef.current = width;

  useIsomorphicLayoutEffect(() => {
    const onResize = () => {
      if (widthRef.current > SCENE_BASELINE_WIDTH && window.innerWidth > SCENE_BASELINE_WIDTH)
        return; // No value in rerendering
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale = Math.min(1, width / SCENE_BASELINE_WIDTH);
  const height = Math.round(targetHeight * scale);
  return { height, scale };
}
