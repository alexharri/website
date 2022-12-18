import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
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
import { ScriptNavigation } from "./ScriptNavigation/ScriptNavigation";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";

const MemoizedEditor = React.memo(Editor);

const FONT_SIZE = 18;
const LINE_HEIGHT_FACTOR = 1.5;
const LINE_HEIGHT = FONT_SIZE * LINE_HEIGHT_FACTOR;
const V_PADDING = 24;

interface Props {
  initialCode: string;
  scriptId: string;
}

export const ScriptedEditor = (props: Props) => {
  const initialCode = useMemo(() => {
    const lines = props.initialCode.split("\n");
    while (lines[0] === "") {
      lines.shift();
    }
    while (lines[lines.length - 1] === "") {
      lines.pop();
    }
    return lines.join("\n");
  }, []);

  const [_editor, setEditor] = useState<MonacoEditor | null>(null);
  const [script, setScript] = useState<ScriptCommand[] | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const heightMeasuredRef = useRef(false);
  const clickedInsideRef = useRef(false);

  useEffect(() => {
    const el = document.querySelector(`[data-script-id="${props.scriptId}"]`)!;
    setScript(JSON.parse(el.getAttribute("data-script")!));
  }, []);

  const runContext = useMemo(
    () => (_editor && script ? new RunContext(_editor, script) : null),
    [_editor, script],
  );
  const runContextRef = useRef(runContext);
  runContextRef.current = runContext;

  const startScript = useCallback(
    async (index: number, delayMs: number) => {
      if (!runContext || !heightMeasuredRef.current) return;

      runContext.startNewRun();

      const { editor } = runContext;
      if (editor.getValue() !== initialCode) {
        editor.setValue(initialCode);
      }

      runScript({ index, delayMs, runContext });
    },
    [runContext],
  );

  async function applyHeightToContainer(runContext: RunContext) {
    const container = containerRef.current!;
    const editorWrapper = editorWrapperRef.current!;

    let height = 0;

    await runScript({
      index: 0,
      runContext,
      forceSync: true,
      onEachStep: () => {
        height = Math.max(height, calculateHeight(runContext.editor.getValue()));
      },
    });

    runContext.editor.layout({ height, width: container.offsetWidth });
    runContext.editor.setValue(initialCode);
    editorWrapper.style.height = height + "px";
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

  const calculateHeight = useCallback((code: string) => {
    return code.split("\n").length * LINE_HEIGHT + V_PADDING * 2;
  }, []);

  const cancelCurrentRun = useCallback(() => {
    runContext?.cancelCurrentRun();
  }, [runContext]);

  const keyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (clickedInsideRef.current) return;

      const isDownArrow = e.keyCode === 40;

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

  const { scriptId } = useContext(FocusedScriptContext);

  useDidUpdate(() => {
    if (scriptId === props.scriptId) {
      startScript(0, 1000);
    } else {
      runContextRef.current?.cancelCurrentRun();
    }
  }, [scriptId]);

  useMouseDownOutside(editorWrapperRef, () => {
    clickedInsideRef.current = false;
    editorWrapperRef.current?.removeAttribute("data-focus-inside");
    runContextRef.current?.cancelCurrentRun();
  });

  const onMouseDown = () => {
    clickedInsideRef.current = true;
    editorWrapperRef.current?.setAttribute("data-focus-inside", "true");
    cancelCurrentRun();
  };

  const [mode] = useColorMode();

  const active = scriptId === props.scriptId;

  const [showNavigation, setShowNavigation] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const main = document.querySelector("main");
    const editorWrapper = editorWrapperRef.current;
    if (!main || !editorWrapper) return;

    if (!showNavigation) {
      main.style.transform = "";
      return;
    }

    const { left } = editorWrapperRef.current.getBoundingClientRect();

    const translate = 300 - (left - 24);

    main.style.transform = `translateX(${translate}px)`;
    main.style.transition = "transform .5s";
  }, [showNavigation]);

  return (
    <div data-scripted-editor={props.scriptId} ref={containerRef} onKeyDownCapture={keyDownCapture}>
      <div className={styles.container} data-active={active}>
        <div
          ref={editorWrapperRef}
          className={styles.editor}
          style={{ minHeight: calculateHeight(initialCode) }}
          onMouseDown={onMouseDown}
        >
          <MemoizedEditor
            defaultValue={initialCode}
            theme={mode === "dark" ? "vs-dark" : "light"}
            language="javascript"
            options={options}
            onMount={setEditor}
          />
        </div>
      </div>
      <button onClick={() => setShowNavigation((show) => !show)}>Step-by-step</button>
      {runContext &&
        ReactDOM.createPortal(
          <ScriptNavigation
            moveToIndex={(index) => startScript(index, 1000)}
            runContext={runContext}
            scriptId={props.scriptId}
            show={showNavigation}
          />,
          document.body,
        )}
    </div>
  );
};

export function withScriptedEditor<T extends { children: any }>(
  Component: React.ComponentType<T>,
  getChildren: (props: T) => string,
) {
  return (props: T) => {
    const children = getChildren(props);
    const searchStr = "// @script ";

    const allLines = children.split("\n");

    const lines = allLines.filter((line) => !line.startsWith(searchStr));
    const scriptLine = allLines.find((line) => line.startsWith(searchStr));

    if (!scriptLine) {
      return <Component {...props} />;
    }

    const initialCode = lines.join("\n");
    const scriptId = scriptLine.split(searchStr)[1].trim();

    return <ScriptedEditor initialCode={initialCode} scriptId={scriptId} />;
  };
}
