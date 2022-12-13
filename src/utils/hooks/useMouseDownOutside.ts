import { useEffect } from "react";

export const useMouseDownOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: (e: MouseEvent) => void,
) => {
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as HTMLElement)) return;
      callback(e);
    };

    window.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  });
};
