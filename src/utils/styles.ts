import { css, keyframes } from "@emotion/css";
import React, { useContext, useMemo } from "react";

export interface StyleOptions {
  theme: unknown;
  styled: { css: typeof css };
  keyframes: typeof keyframes;
}

const ThemeContext = React.createContext({ red: "", blue: "" });

export function useStyles<T extends Record<string, string>>(
  stylesheet: (options: StyleOptions) => T,
) {
  const theme = useContext(ThemeContext);
  return useMemo(() => {
    const classNames = stylesheet({ theme, styled: { css }, keyframes });

    return (className: keyof T & string, props: Partial<Record<string, boolean>> = {}) => {
      const baseClassName = classNames[className];
      if (!baseClassName) {
        console.warn(`No such class name '${className}'`);
        return "";
      }
      const parts: string[] = [baseClassName];
      for (const [key, enabled] of Object.entries(props)) {
        if (enabled) {
          parts.push(baseClassName + "--" + key);
        }
      }
      return parts.join(" ");
    };
  }, [theme]);
}
