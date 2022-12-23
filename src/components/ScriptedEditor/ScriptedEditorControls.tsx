import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";
import { RunContext } from "./run/RunContext";
import { runScript } from "./run/runScript";
import styles from "./ScriptedEditor.module.scss";
import { ScriptNavigation } from "./ScriptNavigation/ScriptNavigation";

interface Props {
  scriptId: string;
  initialCode: string;
  runContext: RunContext | null;
}

export const ScriptedEditorControls = (props: Props) => {
  const { runContext, initialCode } = props;

  const getEditorWrapper = () =>
    document.querySelector(`[data-sripted-editor-wrapper="${props.scriptId}"]`);

  const [isPlaying, setIsPlaying] = useState(false);

  const onMouseDownOutside = () => {
    // focusInsideEditorRef.current = false;
    getEditorWrapper()?.removeAttribute("data-focus-inside");
  };

  const onBigButtonMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDownOutside();
  };

  const startScript = useCallback(
    async (index: number, delayMs: number) => {
      if (!runContext) return;

      runContext.startNewRun();

      const { editor } = runContext;
      if (editor.getValue() !== initialCode) {
        editor.setValue(initialCode);
      }

      runScript({ index, delayMs, runContext });
    },
    [runContext],
  );

  const moveToIndex = useCallback(
    async (index: number) => {
      if (!runContext) return false;

      runContext.startNewRun();

      const { editor } = runContext;
      if (editor.getValue() !== initialCode) {
        editor.setValue(initialCode);
      }

      const canceled = runContext.getCheckCanceledFunction();

      await runScript({ index, runContext, forceSync: true, onlyRunOneCommand: true });

      if (!canceled()) {
        runContext.cancelCurrentRun();
      }
    },
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

  return (
    <div>
      <button
        className={styles.bigButtonWrapper}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => {
          if (isPlaying) {
            runContext?.cancelCurrentRun();
          } else {
            if (!runContext) return;
            startScript(Math.max(0, runContext.index) % (runContext.script.length - 1), 500);
          }
        }}
        data-down={isPlaying}
      >
        <div className={styles.bigButton}>Play</div>
      </button>
      <button
        className={styles.bigButtonWrapper}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => {
          startScript(0, 500);
        }}
      >
        <div className={styles.bigButton}>Restart</div>
      </button>
      <button
        className={styles.bigButtonWrapper}
        onMouseDown={onBigButtonMouseDown}
        onClick={() => {
          setShowNavigation((showNavigation) => !showNavigation);
        }}
        data-down={showNavigation}
      >
        <div className={styles.bigButton}>Focus</div>
      </button>
      {runContext &&
        ReactDOM.createPortal(
          <ScriptNavigation
            moveToIndex={moveToIndex}
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
