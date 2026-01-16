import { useInViewport } from "ahooks";

export function useVisible(ref: React.RefObject<HTMLElement>, margin: string): boolean {
  const [inViewport] = useInViewport(ref, { rootMargin: margin });
  return inViewport ?? false;
}
