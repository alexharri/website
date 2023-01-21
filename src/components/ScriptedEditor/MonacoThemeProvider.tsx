import React, { useEffect, useMemo, useState } from "react";
import loader from "@monaco-editor/loader";
import {
  editorBackground,
  editorSelectionHighlight,
  editorSelectionBackground,
  editorSelectionForeground,
  editorInactiveSelection,
} from "monaco-editor/esm/vs/platform/theme/common/colorRegistry";
import { colorValues } from "../../utils/cssVariables";

let themeDefined = false;

function defineThemes(monaco: ReturnType<typeof useMonaco>) {
  if (themeDefined) return;
  themeDefined = true;
  defineDarkTheme(monaco);
  defineLightTheme(monaco);
}

function defineDarkTheme(monaco: ReturnType<typeof useMonaco>) {
  defineTheme(monaco, "alexharri-dark", "vs-dark", colorValues.dark);
}

function defineLightTheme(monaco: ReturnType<typeof useMonaco>) {
  defineTheme(monaco, "alexharri-light", "vs", colorValues.light);
}

function defineTheme(
  monaco: ReturnType<typeof useMonaco>,
  theme: string,
  base: "vs" | "vs-dark",
  colors: typeof colorValues["dark" | "light"],
) {
  const background = colors["background-500"];
  const text = colors.text;
  const blue = colors.blue;
  const green = colors.green;
  const string = colors["token-string"];
  const number = colors["token-number"];
  const comment = colors["token-comment"];
  monaco!.editor.defineTheme(theme, {
    base,
    inherit: true,
    colors:
      base === "vs"
        ? {
            [editorBackground]: background,
            [editorSelectionHighlight]: "#bcd3dc", // Token selection
            [editorSelectionBackground]: "#9cb7c5", // Command D
            [editorSelectionForeground]: "#b5c9d2",
            [editorInactiveSelection]: "#bdd0da", // Editor does not have focus
          }
        : {
            [editorBackground]: background,
            [editorSelectionHighlight]: "#26354b",
          },
    rules: [
      { token: "", foreground: text, background },
      { token: "emphasis", fontStyle: "italic" },
      { token: "strong", fontStyle: "bold" },
      { token: "variable", foreground: text },
      { token: "variable.predefined", foreground: text },
      { token: "variable.parameter", foreground: text },
      { token: "constant", foreground: string },
      { token: "comment", foreground: comment },
      { token: "number", foreground: number },
      { token: "number.hex", foreground: number },
      { token: "regexp", foreground: string },
      { token: "type", foreground: green },
      { token: "delimiter", foreground: blue },
      { token: "key", foreground: text },
      { token: "string.key.json", foreground: text },
      { token: "string.value.json", foreground: string },
      { token: "attribute.name", foreground: text },
      { token: "attribute.value", foreground: string },
      { token: "attribute.value.number.css", foreground: number },
      { token: "attribute.value.unit.css", foreground: blue },
      { token: "attribute.value.hex.css", foreground: text },
      { token: "string", foreground: string },
      { token: "keyword", foreground: blue },
    ],
  });
}

/**
 * Forked implementation of useMonaco from '@monaco-editor/react'.
 *
 * The original implementation contains a lot of unnecessary error
 * logging for canceling promises, which created a lot of noise
 * in the console during development.
 */
function useMonaco() {
  const [monaco, setMonaco] = useState(loader.__getMonacoInstance());
  useEffect(() => {
    let cancelable: ReturnType<typeof loader.init> | null;

    if (!monaco) {
      cancelable = loader.init();
      cancelable
        .then((monaco) => {
          setMonaco(monaco);
          cancelable = null;
        })
        .catch((e) => {
          if (e?.type === "cancelation") {
            return;
          }
          console.error(e);
        });
    }

    return () => {
      if (cancelable) {
        cancelable.cancel();
      }
    };
  }, []);
  return monaco;
}

export default useMonaco;

export const MonacoThemeContext = React.createContext<{ defined: boolean }>({ defined: false });

export const MonacoThemeProvider: React.FC<{ children: React.ReactNode }> = React.memo(
  ({ children }) => {
    const [defined, setDefined] = useState(false);

    const value = useMemo(() => ({ defined }), [defined]);

    const monaco = useMonaco();

    useEffect(() => {
      if (!monaco) return;
      defineThemes(monaco);
      setDefined(true);
    }, [monaco]);

    return <MonacoThemeContext.Provider value={value}>{children}</MonacoThemeContext.Provider>;
  },
);
