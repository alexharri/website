import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import styles from "./ScriptedEditor.module.scss";
import { MonacoEditor } from "./types/scriptedEditorTypes";
import { ScriptCommand } from "./types/scriptTypes";
import { runScript } from "./run/runScript";
import React from "react";
import { useColorMode } from "../../utils/colorMode";
import { RunContext } from "./run/RunContext";
import { FocusedScriptContext } from "./FocusedScriptContext/FocusedScriptContext";
import { useDidUpdate } from "../../utils/hooks/useDidUpdate";
import { useMouseDownOutside } from "../../utils/hooks/useMouseDownOutside";
import { LazyScriptedEditor } from "./LazyScriptedEditor";
import { scriptedEditorConstants } from "./scriptedEditorConstants";
import { calculateHeight, moveToIndex, startScript } from "./scriptedEditorUtils";
import { withMargin } from "../../utils/withMargin";

const MemoizedEditor = React.memo(Editor);

const { FONT_SIZE, LINE_HEIGHT_FACTOR, V_PADDING } = scriptedEditorConstants;

interface Props {
  language: string;
  initialCode: string;
  scriptId: string;
  onMaxLinesCalculated: (lines: number) => void;
  setRunContext: (runContext: RunContext) => void;
}

export const ScriptedEditor = (props: Props) => {
  const { initialCode } = props;
  const { focusedScriptId } = useContext(FocusedScriptContext);
  const focusedScriptIdRef = useRef(focusedScriptId);
  focusedScriptIdRef.current = focusedScriptId;

  const [_editor, setEditor] = useState<MonacoEditor | null>(null);
  const [script, setScript] = useState<ScriptCommand[] | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const heightMeasuredRef = useRef(false);

  const focusInsideEditor = () =>
    editorWrapperRef.current?.getAttribute("data-focus-inside") === "true";
  const notActiveScript = () => focusedScriptIdRef.current !== props.scriptId;

  useEffect(() => {
    const el = document.querySelector(`[data-script-id="${props.scriptId}"]`)!;
    if (!el) {
      console.warn(`No <CodeScript /> with id ${props.scriptId}`);
      return;
    }
    setScript(JSON.parse(el.getAttribute("data-script")!));
  }, []);

  const runContext = useMemo(
    () => (_editor && script ? new RunContext(_editor, script, initialCode) : null),
    [_editor, script],
  );
  const runContextRef = useRef(runContext);
  runContextRef.current = runContext;

  useEffect(() => {
    if (runContext) {
      props.setRunContext(runContext);
    }
  }, [runContext]);

  const onMoveToIndex = useCallback(
    async (index: number) => runContext && moveToIndex(runContext, index),
    [runContext],
  );

  const onStartScript = useCallback(async () => {
    if (!runContext || !heightMeasuredRef.current) return;
    startScript(runContext, 0, 1000);
  }, [runContext]);

  async function applyHeightToContainer(runContext: RunContext) {
    const container = containerRef.current!;
    const editorWrapper = editorWrapperRef.current!;

    let lines = 0;

    await runScript({
      index: 0,
      runContext,
      forceSync: true,
      onEachStep: () => {
        const value = runContext.editor.getValue();
        lines = Math.max(lines, value.split("\n").length);
      },
    });

    const height = calculateHeight(lines);
    runContext.editor.layout({ height, width: container.offsetWidth });
    runContext.editor.setValue(initialCode);
    editorWrapper.style.height = height + "px";
    props.onMaxLinesCalculated(lines);
  }

  // Measure height on mount
  useEffect(() => {
    if (!runContext) return;
    const container = containerRef.current!;
    for (const selector of [".monaco-editor", ".overflow-guard"]) {
      const el = container.querySelector(selector) as HTMLElement | null;
      if (!el) continue;
      el.style.borderRadius = "8px";
    }
    applyHeightToContainer(runContext).then(() => {
      heightMeasuredRef.current = true;
      (document.activeElement as HTMLInputElement | null)?.blur?.();
    });
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

  const cancelCurrentRun = useCallback(() => {
    runContext?.cancelCurrentRun();
  }, [runContext]);

  const keyDownCapture = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (focusInsideEditor() || notActiveScript()) return;

      const isDownArrow = e.keyCode === 40;
      const isUpArrow = e.keyCode === 38;

      const navigationVisible = !!document.querySelector(
        `[data-script-navigation="${props.scriptId}"]`,
      );
      if (navigationVisible && runContext && (isDownArrow || isUpArrow)) {
        const delta = isDownArrow ? 1 : -1;
        const index = Math.max(Math.min(runContext.index + delta, runContext.script.length - 1), 0);
        onMoveToIndex(index);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const el = document.activeElement as HTMLInputElement | null;
      if (!el) return;
      el.blur();
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (isDownArrow && rect.top < 64) {
          // If the cursor goes off screen, the browser force-scrolls
          // the focused element back into view.
          //
          // Do not refocus if we are using the arrow keys to scroll
          // down and the element is about to go off screen.
          return;
        }
        el?.focus();
      });
    },
    [runContext],
  );

  useEffect(() => {
    window.addEventListener("keydown", keyDownCapture);
    return () => window.removeEventListener("keydown", keyDownCapture);
  }, [keyDownCapture]);

  useDidUpdate(() => {
    if (focusedScriptId === props.scriptId) {
      onStartScript();
    } else {
      runContextRef.current?.cancelCurrentRun();
    }
  }, [focusedScriptId]);

  const onMouseDownOutside = () => {
    editorWrapperRef.current?.removeAttribute("data-focus-inside");
  };
  useMouseDownOutside(editorWrapperRef, onMouseDownOutside);

  const onMouseDown = () => {
    editorWrapperRef.current?.setAttribute("data-focus-inside", "true");
    cancelCurrentRun();
  };

  const [mode] = useColorMode();

  const active = focusedScriptId === props.scriptId;

  return (
    <div data-scripted-editor={props.scriptId} ref={containerRef} onKeyDownCapture={keyDownCapture}>
      <div className={styles.outerContainer} data-active={active}>
        <div className={styles.container}>
          <div
            data-sripted-editor-wrapper={props.scriptId}
            ref={editorWrapperRef}
            className={styles.editor}
            style={{ minHeight: calculateHeight(initialCode.split("\n").length) }}
            onMouseDown={onMouseDown}
          >
            <MemoizedEditor
              defaultValue={initialCode}
              theme={mode === "dark" ? "vs-dark" : "light"}
              language={props.language}
              options={options}
              onMount={setEditor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export function withScriptedEditor<T extends { children: any }>(
  Component: React.ComponentType<T>,
  getProps: (props: T) => { code: string; language: string },
) {
  return withMargin([40, 0], (props: T) => {
    const { code, language } = getProps(props);
    const searchStr = "// @script ";

    const allLines = code.split("\n");

    const lines = allLines.filter((line) => !line.startsWith(searchStr));
    const scriptLine = allLines.find((line) => line.startsWith(searchStr));

    if (!scriptLine) {
      return <Component {...props} />;
    }

    while (lines[0] === "") {
      lines.shift();
    }
    while (lines[lines.length - 1] === "") {
      lines.pop();
    }
    const initialCode = lines.join("\n");
    const [scriptId, expectedLinesStr] = scriptLine.split(searchStr)[1].trim().split(" ");
    const expectedLines = (expectedLinesStr ?? "").split("expectedLines=")[1];

    return (
      <LazyScriptedEditor
        initialCode={initialCode}
        language={language}
        scriptId={scriptId}
        expectedMaxLines={expectedLines ? Number(expectedLines) : lines.length}
      />
    );
  });
}
