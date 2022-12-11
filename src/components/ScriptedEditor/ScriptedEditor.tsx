import { useEffect, useMemo, useState } from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";
import styles from "./ScriptedEditor.module.scss";
import { Command, runCommand } from "./runCommand";

interface Props {
  initialCode: string;
  script: (Command & { times?: number; msBetween?: number })[];
}

export const ScriptedEditor = (props: Props) => {
  const initialCode = useMemo(() => props.initialCode.slice(1, -1), []);

  const [_editor, setEditor] = useState<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);

  useEffect(() => {
    if (!_editor) {
      return () => {};
    }
    const editor = _editor;
    editor.focus();

    let unmounted = false;

    const run = async () => {
      for (const command of props.script) {
        if (unmounted) return;

        const { times = 1, msBetween = 128 } = command;
        if (!Number.isFinite(times)) throw new Error(`Unexpected times value ${times}`);

        for (let i = 0; i < times; i++) {
          runCommand(editor, command);
          if (i < times - 1) {
            await new Promise<void>((resolve) => setTimeout(resolve, msBetween));
          }
        }

        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    };

    setTimeout(run, 1000);

    return () => {
      unmounted = true;
    };
  }, [_editor]);

  const options = useMemo<EditorProps["options"]>(() => ({}), []);

  return (
    <div>
      <MonacoEditor
        defaultValue={initialCode}
        className={styles.editor}
        theme="vs-dark"
        language="typescript"
        options={options}
        onMount={setEditor}
      />
    </div>
  );
};
