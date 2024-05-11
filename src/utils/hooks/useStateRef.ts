import { Dispatch, MutableRefObject, SetStateAction, useRef, useState } from "react";

export function useStateRef<S>(
  defaultValue: S,
): [S, Dispatch<SetStateAction<S>>, MutableRefObject<S>] {
  const [value, setValue] = useState<S>(defaultValue);
  const ref = useRef(value);
  ref.current = value;
  return [value, setValue, ref];
}
