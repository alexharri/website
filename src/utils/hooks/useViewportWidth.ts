import { useEffect, useRef, useState } from "react";

export const useViewportWidth = () => {
  const [width, setWidth] = useState<number | null>(() => {
    return typeof window === "undefined" ? null : window.innerWidth;
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

export const useIsMobile = () => {
  const width = useViewportWidth();
  return !!(width && width <= 800);
};