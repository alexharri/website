import { useCallback, useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";
import { FocusedScriptContext } from "./FocusedScriptContext/FocusedScriptContext";
import { RunContext } from "./run/RunContext";
import styles from "./ScriptedEditor.module.scss";
import { moveToIndex, startScript } from "./scriptedEditorUtils";
import { ScriptNavigation } from "./ScriptNavigation/ScriptNavigation";

interface Props {
  scriptId: string;
  initialCode: string;
  runContext: RunContext | null;
  loop: boolean;
}

export const ScriptedEditorControls = (props: Props) => {
  const { runContext } = props;

  const { focusedScriptId } = useContext(FocusedScriptContext);

  const getEditorWrapper = () =>
    document.querySelector(`[data-sripted-editor-wrapper="${props.scriptId}"]`);

  const [isPlaying, setIsPlaying] = useState(false);

  const onBigButtonMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    getEditorWrapper()?.removeAttribute("data-focus-inside");
  };

  const onStartScript = useCallback(
    async (index: number) =>
      runContext && startScript({ runContext, index, delayMs: 500, loop: props.loop }),
    [runContext],
  );

  const onMoveToIndex = useCallback(
    async (index: number) => runContext && moveToIndex(runContext, index),
    [runContext],
  );

  useEffect(() => {
    if (!runContext) return;
    runContext.subscribe("playing", setIsPlaying);
    return () => runContext.unsubscribe("playing", setIsPlaying);
  }, [runContext]);

  const [showNavigation, setShowNavigation] = useState(false);
  const showNavigationRef = useRef(showNavigation);
  showNavigationRef.current = showNavigation;

  useIsomorphicLayoutEffect(() => {
    const main = document.querySelector("main");
    const editorWrapper = getEditorWrapper();
    if (!main || !editorWrapper) return;

    if (!showNavigation) {
      main.style.transform = "";
      return;
    }

    const { left } = editorWrapper.getBoundingClientRect();

    const translate = Math.max(0, 300 - (left - 24));

    main.style.transform = `translateX(${translate}px)`;
    main.style.transition = "transform .5s";
  }, [showNavigation]);

  const isFocused = props.scriptId === focusedScriptId;

  return (
    <div style={{ marginTop: 24 }}>
      <button
        className={[styles.bigButtonWrapper, styles.slideIn].join(" ")}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => {
          if (isPlaying) {
            runContext?.cancelCurrentRun();
          } else {
            if (!runContext) return;
            onStartScript(Math.max(0, runContext.index) % (runContext.script.length - 1));
          }
        }}
        data-down={isPlaying}
        data-active={isFocused}
      >
        <div className={styles.bigButton}>Play</div>
      </button>
      <button
        className={[styles.textButton, styles.slideIn].join(" ")}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => onStartScript(0)}
        data-nth="2"
        data-active={isFocused}
      >
        Play again
      </button>

      <button
        className={[styles.textButton, styles.slideIn].join(" ")}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => {
          setShowNavigation((showNavigation) => !showNavigation);
        }}
        data-nth="3"
        data-down={showNavigation}
        data-active={isFocused}
      >
        View steps
      </button>

      {runContext &&
        ReactDOM.createPortal(
          <ScriptNavigation
            moveToIndex={onMoveToIndex}
            runContext={runContext}
            scriptId={props.scriptId}
            show={showNavigation}
            setShow={setShowNavigation}
          />,
          document.body,
        )}
    </div>
  );
};
