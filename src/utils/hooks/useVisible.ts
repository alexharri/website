import { useEffect, useRef, useState } from "react";

export function useVisible(ref: React.RefObject<HTMLElement>, margin: string) {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const el = ref.current!;
    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (!entry) {
        console.warn("Received 0 entries from IntersectionObserver");
        return;
      }
      if (visibleRef.current === entry.isIntersecting) return;
      setVisible(entry.isIntersecting);
    };
    const observer = new IntersectionObserver(callback, {
      root: document,
      rootMargin: margin,
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return visible;
}
