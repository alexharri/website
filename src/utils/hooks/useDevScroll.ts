import { useEffect, useRef } from "react";

const SCROLL_KEY = "__scroll_dev__";
const IS_DEV = process.env.NODE_ENV === "development";

function usePreserveScrollOnResize() {
  const topElementRef = useRef<Element | null>(null);
  const topOffsetRef = useRef(0);

  useEffect(() => {
    if (!IS_DEV) return;

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

    findTopElement();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", findTopElement);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", findTopElement);
    };
  }, []);
}

function useRestoreScrollOnReload() {
  useEffect(() => {
    if (!IS_DEV) return;

    const initialScrollY = Number(sessionStorage.getItem(SCROLL_KEY));
    if (Number.isFinite(initialScrollY)) {
      window.scrollTo(0, initialScrollY);
    }

    let scrolled = false;
    const scrollListener = () => (scrolled = true);

    const interval = window.setInterval(() => {
      if (scrolled) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
      scrolled = false;
    }, 500);

    window.addEventListener("scroll", scrollListener);
    return () => {
      window.removeEventListener("scroll", scrollListener);
      window.clearInterval(interval);
    };
  }, []);
}

export function useDevScroll() {
  useRestoreScrollOnReload();
  usePreserveScrollOnResize();
}
