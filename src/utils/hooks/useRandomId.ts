import { useMemo } from "react";

// Silly, but good enough
export function useRandomId() {
  return useMemo(() => (Math.random() * 1_000_000_000).toFixed(0), []);
}
