import { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDidUpdate } from "../../../utils/hooks/useDidUpdate";
import { FocusedScriptContext } from "../FocusedScriptContext/FocusedScriptContext";
import { RunContext } from "../run/RunContext";
import styles from "./ScriptNavigation.module.scss";
import { RenderCommand } from "../RenderCommand/RenderCommand";

interface Props {
  scriptId: string;
  moveToIndex: (index: number) => void;
  runContext: RunContext;
}

export const ScriptNavigation = (props: Props) => {
  const { runContext } = props;
  const { scriptId } = useContext(FocusedScriptContext);

  const commandElRef = useRef<Partial<Record<number, HTMLDivElement>>>({});
  const commandHeightRef = useRef<Partial<Record<number, number>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getEl = (index: number) => {
      if (!commandElRef.current[index]) {
        commandElRef.current[index] = scrollRef.current!.querySelector(
          `[data-command="${index}"]`,
        ) as HTMLDivElement;
      }
      return commandElRef.current[index]!;
    };

    const getCommandHeight = (index: number) => {
      if (!commandHeightRef.current[index]) {
        commandHeightRef.current[index] = getEl(index).getBoundingClientRect().height;
      }
      return commandHeightRef.current[index]!;
    };

    const handler = (index: number, _time: number) => {
      if (!scrollRef.current) return;
      let translateY = -32;
      for (let i = 0; i < index; i++) {
        translateY -= getCommandHeight(i);
      }
      scrollRef.current.style.transform = `translateY(${translateY}px)`;

      for (let i = 0; i < runContext.script.length; i++) {
        const distance = Math.abs(i - index);
        const el = getEl(i);
        el.style.opacity = distance === 0 ? "" : String(Math.max(0.2, 0.6 - distance * 0.1));
      }
    };
    runContext.subscribe("run-command", handler);
    handler(0, 0);
    return () => {
      commandElRef.current = {};
      commandHeightRef.current = {};
      runContext.unsubscribe("run-command", handler);
    };
  }, [runContext]);

  const [show, setShow] = useState(false);
  const showRef = useRef(show);

  showRef.current = show;
  const lastShownAt = useRef(0);

  useDidUpdate(() => {
    if (!scriptId) lastShownAt.current = Date.now();
    if (scriptId !== props.scriptId) {
      if (showRef.current) setShow(false);
      return;
    }
    const timeSinceLastShow = Math.max(500, Date.now() - lastShownAt.current);
    const timeout = setTimeout(() => setShow(true), 500 - timeSinceLastShow);
    return () => clearTimeout(timeout);
  }, [scriptId]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className={styles.container}
        >
          <div className={styles.scroll} style={{ transform: "translateY(-32px)" }} ref={scrollRef}>
            {props.runContext.script.map((command, i) => (
              <div data-command={i} className={styles.command} key={i}>
                <RenderCommand command={command} onClick={() => props.moveToIndex(i)} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
