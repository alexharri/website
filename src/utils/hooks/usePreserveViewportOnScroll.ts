import { useEffect, useRef } from "react";

export function usePreserveViewportOnResize() {
  const topElementRef = useRef<Element | null>(null);
  const topOffsetRef = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const findTopElement = () => {
      const main = document.querySelector("main")!;
      for (const el of [...main.children]) {
        const { top } = el.getBoundingClientRect();
        if (top >= 0) {
          topElementRef.current = el;
          topOffsetRef.current = top;
          break;
        }
      }
    };

    const handleResize = () => {
      if (topElementRef.current) {
        const rect = topElementRef.current.getBoundingClientRect();
        const offsetChange = rect.top - topOffsetRef.current;
        window.scrollBy(0, offsetChange);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", findTopElement);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", findTopElement);
    };
  }, []);
}
