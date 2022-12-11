import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import styles from "./ScriptedEditor.module.scss";
import { MonacoEditor } from "./types/scriptedEditorTypes";
import { ScriptCommand } from "./types/scriptTypes";
import { runScript } from "./run/runScript";
import { ScriptCommands } from "./ScriptCommands/ScriptCommands";
import React from "react";
import { useColorMode } from "../../utils/colorMode";

const MemoizedEditor = React.memo(Editor);

const FONT_SIZE = 24;
const LINE_HEIGHT_FACTOR = 1.5;
const LINE_HEIGHT = FONT_SIZE * LINE_HEIGHT_FACTOR;
const V_PADDING = 24;

interface Props {
  initialCode: string;
  script: ScriptCommand[];
}

export const ScriptedEditor = (props: Props) => {
  const initialCode = useMemo(() => props.initialCode.slice(1, props.initialCode.length - 3), []);

  const [_editor, setEditor] = useState<MonacoEditor | null>(null);
  const editorRef = useRef<MonacoEditor>(null!);
  if (_editor) editorRef.current = _editor;

  const scriptIdRef = useRef(0);

  const startScript = useCallback(
    async (index: number, delay: number, _isCanceled?: () => boolean) => {
      const editor = editorRef.current;
      if (editor.getValue() !== initialCode) {
        editor.setValue(initialCode);
      }

      const localScriptId = ++scriptIdRef.current;

      function isCanceled() {
        return _isCanceled?.() || scriptIdRef.current !== localScriptId;
      }

      runScript(index, delay, editorRef.current, props.script, isCanceled);
    },
    [],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return () => {};
    }

    let unmounted = false;
    startScript(0, 1000, () => unmounted);
    return () => {
      unmounted = true;
    };
  }, [_editor]);

  const options = useMemo<EditorProps["options"]>(
    () => ({
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT_FACTOR,
      lineNumbers: "off",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: V_PADDING, bottom: V_PADDING },
    }),
    [],
  );

  const calculateHeight = useCallback((code: string) => {
    return code.split("\n").length * LINE_HEIGHT + V_PADDING * 2;
  }, []);

  const onChange = useCallback((value?: string) => {
    const height = value ? calculateHeight(value) : 128;
    const width = document.getElementById("editor-container")!.getBoundingClientRect().width;
    editorRef.current?.layout({ height, width });
  }, []);

  const stopScript = useCallback(() => {
    scriptIdRef.current++;
  }, []);

  const [mode] = useColorMode();

  return (
    <div id="editor-container" onMouseDown={stopScript} onKeyDown={stopScript}>
      <MemoizedEditor
        defaultValue={initialCode}
        className={styles.editor}
        theme={mode === "dark" ? "vs-dark" : "light"}
        language="typescript"
        options={options}
        onMount={setEditor}
        onChange={onChange}
        height={calculateHeight(initialCode)}
      />
      <button onClick={() => startScript(0, 1000)}>Start script</button>
      <ScriptCommands
        index={2}
        moveToIndex={(index) => startScript(index, 1000)}
        script={props.script}
      />
    </div>
  );
};
