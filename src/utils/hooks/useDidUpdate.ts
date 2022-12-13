import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export const useDidUpdate = (callback: () => void, dependencies: any[]) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      callback();
      return;
    }
    mounted.current = true;
  }, dependencies);
};

export const useDidUpdateLayoutEffect = (callback: () => void, dependencies: any[]) => {
  const mounted = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (mounted.current) {
      callback();
      return;
    }
    mounted.current = true;
  }, dependencies);
};
