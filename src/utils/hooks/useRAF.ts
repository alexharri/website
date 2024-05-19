import { useEffect } from "react";

export function useRAF(onTick: () => void) {
  useEffect(() => {
    let stop = false;
    const tick = () => {
      if (stop) return;
      requestAnimationFrame(tick);
      onTick();
    };
    tick();
    return () => {
      stop = true;
    };
  }, []);
}
