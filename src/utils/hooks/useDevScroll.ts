import { useEffect } from "react";

const key = "__scroll_dev__";

export function useDevScroll() {
  useEffect(() => {
    const initialScrollY = Number(sessionStorage.getItem(key));
    if (Number.isFinite(initialScrollY)) {
      window.scrollTo(0, initialScrollY);
    }

    let scrolled = false;
    const scrollListener = () => (scrolled = true);

    const interval = window.setInterval(() => {
      if (scrolled) {
        sessionStorage.setItem(key, String(window.scrollY));
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
