import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import styles from "./ScriptedEditor.module.scss";
import { MonacoEditor } from "./types/scriptedEditorTypes";
import { ScriptCommand } from "./types/scriptTypes";
import { runScript } from "./run/runScript";
import { ScriptCommands } from "./ScriptCommands/ScriptCommands";
import React from "react";
import { useColorMode } from "../../utils/colorMode";
import { RunContext } from "./run/RunContext";

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

  const runContext = useMemo(
    () => (_editor ? new RunContext(_editor, props.script) : null),
    [_editor],
  );
  const runContextRef = useRef(runContext);
  runContextRef.current = runContext;

  const startScript = useCallback(
    async (index: number, delay: number) => {
      if (!runContext) return;
      runContext.startNewRun();

      const { editor } = runContext;
      if (editor.getValue() !== initialCode) {
        editor.setValue(initialCode);
      }

      runScript(index, delay, runContext);
    },
    [runContext],
  );

  // Run script on mount
  useEffect(() => {
    if (!runContext) return;
    startScript(0, 1000);
    return () => runContext.cancelCurrentRun();
  }, [runContext]);

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
    const { editor } = runContext!;
    const height = value ? calculateHeight(value) : 128;
    const width = document.getElementById("editor-container")!.getBoundingClientRect().width;
    editor.layout({ height, width });
  }, []);

  const cancelCurrentRun = useCallback(() => {
    runContext?.cancelCurrentRun();
  }, [runContext]);

  const [mode] = useColorMode();

  return (
    <div id="editor-container" onMouseDown={cancelCurrentRun} onKeyDown={cancelCurrentRun}>
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
      {runContext && (
        <ScriptCommands
          moveToIndex={(index) => startScript(index, 1000)}
          script={props.script}
          runContext={runContext}
        />
      )}
    </div>
  );
};
