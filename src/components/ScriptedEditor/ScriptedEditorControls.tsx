import { useCallback, useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";
import { FocusedScriptContext } from "./FocusedScriptContext/FocusedScriptContext";
import { RunContext } from "./run/RunContext";
import styles from "./ScriptedEditor.module.scss";
import { scriptedEditorConstants } from "./scriptedEditorConstants";
import { moveToIndex, startScript } from "./scriptedEditorUtils";
import { ScriptNavigation } from "./ScriptNavigation/ScriptNavigation";

const { SCRIPT_NAVIGATION_WIDTH, SCRIPT_NAVIGATION_BREAKPOINT } = scriptedEditorConstants;

interface Props {
  scriptId: string;
  initialCode: string;
  runContext: RunContext | null;
  loop: boolean;
}

export const ScriptedEditorControls = (props: Props) => {
  const { runContext } = props;

  const { focusedScriptId } = useContext(FocusedScriptContext);
  const isFocusedRef = useRef(false);
  isFocusedRef.current = focusedScriptId === props.scriptId;

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

  const setMainPosition = useCallback((showNavigation: boolean, resize: boolean) => {
    const isMobile = window.innerWidth < SCRIPT_NAVIGATION_BREAKPOINT;
    const main = document.querySelector("main");
    const editorWrapper = getEditorWrapper();
    if (!main || !editorWrapper) return;

    if (!showNavigation || isMobile) {
      if (!resize) {
        main.style.transition = "transform .5s";
      }
      main.style.transform = "";
      return;
    }

    // Reset before measuring
    main.style.transform = "";
    main.style.transition = "";

    const { left, width } = editorWrapper.getBoundingClientRect();

    const availableWidth = window.innerWidth - SCRIPT_NAVIGATION_WIDTH;
    const targetLeft = SCRIPT_NAVIGATION_WIDTH + availableWidth / 2 - width / 2;
    const translate = targetLeft - left;

    if (!resize) {
      main.style.transition = "transform .5s";
    }
    main.style.transform = `translateX(${translate}px)`;
  }, []);

  useIsomorphicLayoutEffect(() => {
    setMainPosition(showNavigation, false);
  }, [showNavigation]);

  useEffect(() => {
    const listener = () => {
      if (!isFocusedRef.current) return;
      setMainPosition(showNavigationRef.current, true);
    };
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  const isFocused = props.scriptId === focusedScriptId;

  return (
    <div style={{ marginTop: 16 }}>
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
