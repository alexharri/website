import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import styles from "./ScriptedEditor.module.scss";
import { MonacoEditor } from "./scriptedEditorTypes";
import { ScriptCommand } from "./scriptTypes";
import { runScript } from "./runScript";

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

  const startScript = useCallback(async (_isCanceled?: () => boolean) => {
    const editor = editorRef.current;
    if (editor.getValue() !== initialCode) {
      editor.setValue(initialCode);
    }

    const localScriptId = scriptIdRef.current;

    function isCanceled() {
      return _isCanceled?.() || scriptIdRef.current !== localScriptId;
    }

    runScript(editorRef.current, props.script, isCanceled);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return () => {};
    }

    let unmounted = false;
    setTimeout(() => startScript(() => unmounted), 1000);
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

  const initialheight = useMemo(() => calculateHeight(initialCode), []);

  const onChange = useCallback((value?: string) => {
    const height = value ? calculateHeight(value) : 128;
    const width = document.getElementById("editor-container")!.getBoundingClientRect().width;
    editorRef.current?.layout({ height, width });
  }, []);

  const stopScript = useCallback(() => {
    scriptIdRef.current++;
  }, []);

  return (
    <div id="editor-container" onMouseDown={stopScript} onKeyDown={stopScript}>
      <Editor
        defaultValue={initialCode}
        className={styles.editor}
        theme="vs-dark"
        language="typescript"
        options={options}
        onMount={setEditor}
        onChange={onChange}
        height={initialheight}
      />
      <button onClick={() => startScript()}>Start script</button>
    </div>
  );
};
