import React, { useEffect, useMemo, useState } from "react";
import loader from "@monaco-editor/loader";
import {
  editorBackground,
  editorSelectionHighlight,
} from "monaco-editor/esm/vs/platform/theme/common/colorRegistry";

let themeDefined = false;

function defineThemes(monaco: ReturnType<typeof useMonaco>) {
  if (themeDefined) return;
  themeDefined = true;
  defineDarkTheme(monaco);
  defineLightTheme(monaco);
}

function defineDarkTheme(monaco: ReturnType<typeof useMonaco>) {
  defineTheme(monaco, "alexharri-dark", "vs-dark", {
    background: "#192535",
    blue: "#399EF4",
    text: "#9FCFF9",
    string: "#DA6771",
    number: "#E5949B",
    green: "#4EB071",
    comment: "#535A6B",
    selection: "#293951",
  });
}

function defineLightTheme(monaco: ReturnType<typeof useMonaco>) {
  defineTheme(monaco, "alexharri-light", "vs", {
    background: "#eaeeef",
    blue: "#006bc5",
    text: "#141d2c",
    string: "#ba391a",
    number: "#ab5e07",
    green: "#008f10",
    comment: "#7998a7",
    selection: "#cedbe9",
  });
}

interface Colors {
  background: string;
  blue: string;
  text: string;
  string: string;
  number: string;
  green: string;
  comment: string;
  selection: string;
}

function defineTheme(
  monaco: ReturnType<typeof useMonaco>,
  theme: string,
  base: "vs" | "vs-dark",
  colors: Colors,
) {
  const { background, blue, text, string, number, green, comment, selection } = colors;
  monaco!.editor.defineTheme(theme, {
    base,
    inherit: true,
    colors: {
      [editorBackground]: background,
      [editorSelectionHighlight]: selection,
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
