import { useCallback, useContext, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDidUpdate, useDidUpdateLayoutEffect } from "../../../utils/hooks/useDidUpdate";
import { FocusedScriptContext } from "../FocusedScriptContext/FocusedScriptContext";
import { RunContext } from "../run/RunContext";
import styles from "./ScriptNavigation.module.scss";
import { RenderCommand } from "../RenderCommand/RenderCommand";
import { useViewportWidth } from "../../../utils/hooks/useViewportWidth";
import { moveToIndex } from "../scriptedEditorUtils";
import { scriptedEditorConstants } from "../scriptedEditorConstants";
import { ArrowIcon16 } from "../../Icon/ArrowIcon16";

const { SCRIPT_NAVIGATION_WIDTH, SCRIPT_NAVIGATION_BREAKPOINT, SCRIPT_NAVIGATION_DRAWER_HEIGHT } =
  scriptedEditorConstants;

interface Props {
  scriptId: string;
  moveToIndex: (index: number) => void;
  runContext: RunContext;
  show: boolean;
  setShow: (show: boolean) => void;
}

export const ScriptNavigation = (props: Props) => {
  const { runContext, show, setShow } = props;
  const { focusedScriptId: scriptId } = useContext(FocusedScriptContext);

  const width = useViewportWidth();
  const isMobile = typeof width === "number" && width < SCRIPT_NAVIGATION_BREAKPOINT;

  const commandElRef = useRef<Partial<Record<number, HTMLDivElement>>>({});
  const commandHeightRef = useRef<Partial<Record<number, number>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrowKeyHintRef = useRef<HTMLParagraphElement>(null);

  const getEl = useCallback((index: number) => {
    return scrollRef.current!.querySelector(`[data-command="${index}"]`) as HTMLDivElement;
  }, []);

  const getCommandHeight = useCallback((index: number) => {
    if (!commandHeightRef.current[index]) {
      commandHeightRef.current[index] = getEl(index).getBoundingClientRect().height;
    }
    return commandHeightRef.current[index]!;
  }, []);

  const onIndexChange = useCallback((index: number) => {
    if (!scrollRef.current) return;
    let translateY = -32;
    for (let i = 0; i < index; i++) {
      translateY -= getCommandHeight(i);
    }
    scrollRef.current.style.transform = `translateY(${translateY}px)`;

    for (let i = 0; i < runContext.script.length; i++) {
      const distance = Math.abs(i - index);
      const el = getEl(i);
      el.style.opacity = distance === 0 ? "" : String(Math.max(0.2, 0.4 - distance * 0.1));
    }

    if (arrowKeyHintRef.current) {
      arrowKeyHintRef.current.setAttribute(
        "data-active",
        String(index === runContext.script.length - 1),
      );
    }
  }, []);

  useEffect(() => {
    runContext.subscribe("run-command", onIndexChange);
    return () => {
      commandElRef.current = {};
      commandHeightRef.current = {};
      runContext.unsubscribe("run-command", onIndexChange);
    };
  }, [runContext]);

  const showRef = useRef(show);
  showRef.current = show;

  const lastShownAt = useRef(0);

  useDidUpdate(() => {
    if (!scriptId) lastShownAt.current = Date.now();
    if (scriptId !== props.scriptId) {
      if (showRef.current) setShow(false);
      return;
    }
  }, [scriptId]);

  useDidUpdateLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!show || !scroll) return;
    const originalTransition = scroll.style.transition;
    scroll.style.transition = "none";
    onIndexChange(runContext.index);
    requestAnimationFrame(() => {
      scroll.style.transition = originalTransition;
    });
  }, [show]);

  const onMoveIndex = (delta: number) => {
    const index = Math.max(Math.min(runContext.index + delta, runContext.script.length - 1), 0);
    moveToIndex(runContext, index);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          transition={{ duration: 0.5, ease: [0.26, 0.03, 0.3, 0.96] }}
          initial={
            isMobile ? { y: SCRIPT_NAVIGATION_DRAWER_HEIGHT } : { x: -SCRIPT_NAVIGATION_WIDTH }
          }
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: SCRIPT_NAVIGATION_DRAWER_HEIGHT } : { x: -SCRIPT_NAVIGATION_WIDTH }}
          className={isMobile ? styles.containerMobile : styles.container}
          data-script-navigation={props.scriptId}
        >
          <div className={styles.activeCommandHighlight} />
          <div className={styles.scroll} style={{ transform: "translateY(-32px)" }} ref={scrollRef}>
            {props.runContext.script.map((command, i) => (
              <div data-command={i} className={styles.command} key={i}>
                <RenderCommand command={command} onClick={() => props.moveToIndex(i)} />
              </div>
            ))}
            {!isMobile && (
              <p className={styles.arrowKeyHint} ref={arrowKeyHintRef}>
                <span>Hint:</span>
                <span>
                  Use the arrow keys (
                  <i className={styles.arrowIcon}>
                    <ArrowIcon16 direction="up" />
                  </i>
                  ,{" "}
                  <i className={styles.arrowIcon}>
                    <ArrowIcon16 direction="down" />
                  </i>
                  ) to move between the steps
                </span>
              </p>
            )}
          </div>
          {isMobile && (
            <div className={styles.moveButtonWrapper}>
              <button className={styles.moveButton} onClick={() => onMoveIndex(-1)}>
                Prev
              </button>
              <button className={styles.moveButton} onClick={() => onMoveIndex(1)}>
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
