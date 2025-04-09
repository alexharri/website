import { useEffect, useRef, useState } from "react";
import { cssVariables } from "../cssVariables";

const createUseViewportWidth = (isomorphic: boolean) => () => {
  const [width, setWidth] = useState<number | null>(() => {
    return isomorphic || typeof window === "undefined" ? null : window.innerWidth;
  });
  const widthRef = useRef(width);
  widthRef.current = width;

  useEffect(() => {
    const listener = () => {
      if (window.innerWidth === widthRef.current) return;
      setWidth(window.innerWidth);
    };
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  return width;
};

export const useViewportWidth = createUseViewportWidth(false);
export const useIsomorphicViewportWidth = createUseViewportWidth(true);

export const useIsMobile = () => {
  const width = useViewportWidth();
  return !!(width && width <= cssVariables.mobileWidth);
};
