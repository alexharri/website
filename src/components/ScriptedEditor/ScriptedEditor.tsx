import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import { MonacoEditor } from "./types/scriptedEditorTypes";
import { ScriptCommand } from "./types/scriptTypes";
import { runScript } from "./run/runScript";
import React from "react";
import { RunContext } from "./run/RunContext";
import { FocusedScriptContext } from "./FocusedScriptContext/FocusedScriptContext";
import { useMouseDownOutside } from "../../utils/hooks/useMouseDownOutside";
import { scriptedEditorConstants } from "./scriptedEditorConstants";
import { calculateHeight, moveToIndex, startScript } from "./scriptedEditorUtils";
import { useIsMobile, useViewportWidth } from "../../utils/hooks/useViewportWidth";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";
import { useDidUpdate } from "../../utils/hooks/useDidUpdate";
import { useStyles } from "../../utils/styles";
import { ScriptedEditorStyles } from "./ScriptedEditor.styles";
import { cssVariables } from "../../utils/cssVariables";

const MemoizedEditor = React.memo(Editor);

const { FONT_SIZE, LINE_HEIGHT_FACTOR, V_PADDING, SCRIPTED_EDITOR_MIN_WIDTH } =
  scriptedEditorConstants;

interface Props {
  language: string;
  initialCode: string;
  scriptId: string;
  onMaxLinesCalculated: (lines: number) => void;
  setRunContext: (runContext: RunContext) => void;
  loop: boolean;
}

/**
 * Do NOT use directly. Use through 'withScriptedEditor' defined
 * in 'LazyScriptedEditor.js'.
 */
export const __ScriptedEditor = (props: Props) => {
  const s = useStyles(ScriptedEditorStyles);
  const { initialCode, scriptId } = props;
  const { focusedScriptId } = useContext(FocusedScriptContext);
  const focusedScriptIdRef = useRef(focusedScriptId);
  focusedScriptIdRef.current = focusedScriptId;

  const [_editor, setEditor] = useState<MonacoEditor | null>(null);
  const [script, setScript] = useState<ScriptCommand[] | null>(null);

  const width = useViewportWidth()!;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const heightMeasuredRef = useRef(false);

  const focusInsideEditor = () =>
    editorWrapperRef.current?.getAttribute("data-focus-inside") === "true";
  const notActiveScript = () => focusedScriptIdRef.current !== scriptId;

  useEffect(() => {
    const el = document.querySelector(`[data-script-id="${scriptId}"]`)!;
    if (!el) {
      console.warn(`No <CodeScript /> with id ${scriptId}`);
      return;
    }
    setScript(JSON.parse(el.getAttribute("data-script")!));
  }, []);

  const renderExecElement = useCallback((text: string) => {
    const container = editorWrapperRef.current;

    const el = document.createElement("div");
    el.className = s("exec");
    container?.appendChild(el);

    const textEl = document.createElement("span");
    textEl.setAttribute("data-text-element", "true");
    textEl.innerText = text;
    el.appendChild(textEl);

    return el;
  }, []);

  const runContext = useMemo(
    () =>
      _editor && script
        ? new RunContext({ editor: _editor, script, initialCode, scriptId, renderExecElement })
        : null,
    [_editor, script],
  );
  const runContextRef = useRef(runContext);
  runContextRef.current = runContext;

  useEffect(() => {
    if (runContext) {
      props.setRunContext(runContext);
      runContext.editor.onDidFocusEditorText(() => {
        runContext.clearDecorations();
        runContext.cancelCurrentRun();
      });
    }
  }, [runContext]);

  const onMoveToIndex = useCallback(
    async (index: number) => runContext && moveToIndex(runContext, index),
    [runContext],
  );

  const onStartScript = useCallback(async () => {
    if (!runContext || !heightMeasuredRef.current) return;
    startScript({ runContext, index: 0, delayMs: 1000, loop: props.loop });
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

  const isMobile = useIsMobile();

  // Measure height on mount
  useEffect(() => {
    if (!runContext) return;
    applyHeightToContainer(runContext).then(() => {
      heightMeasuredRef.current = true;
      (document.activeElement as HTMLInputElement | null)?.blur?.();
      if (focusedScriptIdRef.current === scriptId) {
        onStartScript();
      }
    });
  }, [runContext]);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current!;
    for (const selector of [".monaco-editor", ".overflow-guard"]) {
      const el = container.querySelector(selector) as HTMLElement | null;
      if (!el) continue;
      el.style.borderRadius = isMobile ? "" : "8px";
    }
  }, [isMobile, runContext]);

  const options = useMemo<EditorProps["options"]>(
    () => ({
      fontSize: FONT_SIZE,
      fontFamily: cssVariables.fontMonospace,
      lineHeight: LINE_HEIGHT_FACTOR,
      lineNumbers: "off",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: V_PADDING, bottom: V_PADDING },
      renderLineHighlight: "none",
      folding: true,
      insertSpaces: true,
      tabSize: 2,
    }),
    [],
  );

  const keyDownCapture = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (notActiveScript() || focusInsideEditor()) return;

      const isDownArrow = e.keyCode === 40;
      const isUpArrow = e.keyCode === 38;

      const navigationVisible = !!document.querySelector(`[data-script-navigation="${scriptId}"]`);
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
      runContextRef.current!.scrolledAt = Date.now();
    },
    [runContext],
  );

  useEffect(() => {
    window.addEventListener("keydown", keyDownCapture);
    return () => window.removeEventListener("keydown", keyDownCapture);
  }, [keyDownCapture]);

  useDidUpdate(() => {
    if (focusedScriptId === scriptId) {
      onStartScript();
    } else if (runContextRef.current) {
      const runContext = runContextRef.current;
      const { editor } = runContext;
      runContext.cancelCurrentRun();
      if (editor.hasTextFocus()) {
        (document.activeElement as HTMLTextAreaElement | null)?.blur();
      }
    }
  }, [focusedScriptId]);

  const onMouseDownOutside = () => {
    editorWrapperRef.current?.removeAttribute("data-focus-inside");
  };
  useMouseDownOutside(editorWrapperRef, onMouseDownOutside);

  const onMouseDown = () => {
    editorWrapperRef.current?.setAttribute("data-focus-inside", "true");
    runContextRef.current?.cancelCurrentRun();
  };

  const active = focusedScriptId === scriptId;

  const scale = width < SCRIPTED_EDITOR_MIN_WIDTH ? width / SCRIPTED_EDITOR_MIN_WIDTH : 1;

  return (
    <div ref={containerRef} onKeyDownCapture={keyDownCapture}>
      <div className={s("outerContainer")} data-active={active}>
        <div
          style={{
            transform: `scale(${scale})`,
            width: scale < 1 ? window.innerWidth / scale : undefined,
            transformOrigin: "0 0",
          }}
        >
          <div
            data-sripted-editor-wrapper={scriptId}
            ref={editorWrapperRef}
            className={s("editor")}
            style={{ minHeight: calculateHeight(initialCode.split("\n").length) }}
            onMouseDown={onMouseDown}
          >
            <MemoizedEditor
              defaultValue={initialCode}
              theme="alexharri-dark"
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
