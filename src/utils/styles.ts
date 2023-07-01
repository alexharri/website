import { css, keyframes } from "@emotion/css";
import React, { useContext, useMemo } from "react";
import { colors } from "./cssVariables";

export interface StyleOptions {
  theme: typeof colors;
  styled: { css: typeof css };
  keyframes: typeof keyframes;
}

const ThemeContext = React.createContext({ red: "", blue: "" });

export function useStyles<T extends Record<string, string>>(
  stylesheet: (options: StyleOptions) => T,
) {
  const theme = useContext(ThemeContext);
  return useMemo(() => {
    const classNames = stylesheet({ theme: colors, styled: { css }, keyframes });

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
