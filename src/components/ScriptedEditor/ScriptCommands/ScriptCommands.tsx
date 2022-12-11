import { useEffect, useState } from "react";
import { RunContext } from "../run/RunContext";
import { ScriptCommand } from "../types/scriptTypes";
import styles from "./ScriptCommands.module.scss";

interface Props {
  moveToIndex: (index: number) => void;
  script: ScriptCommand[];
  runContext: RunContext;
}

const modifierKeys = new Set(["Command", "Shift", "Option", "Ctrl"]);

function isModifier(key: string) {
  return modifierKeys.has(key);
}

function getKeyLabel(key: string) {
  switch (key) {
    case "Command":
      return "⌘";
    case "Option":
      return "⌥";
    case "Shift":
      return "⇧";
    case "Ctrl":
      return "⌃";
    case "Right":
      return "→";
    case "Left":
      return "←";
    default:
      return key;
  }
}

function extractKeys(command: string): { modifierKeys: string[]; keys: string[] } {
  const keys: string[] = [];
  const modifierKeys: string[] = [];

  for (const key of command.split(" ")) {
    const list = isModifier(key) ? modifierKeys : keys;
    list.push(getKeyLabel(key));
  }

  return { keys, modifierKeys };
}

export const ScriptCommands = (props: Props) => {
  const { runContext } = props;

  const [index, setIndex] = useState(-1);

  useEffect(() => {
    const handler = (index: number, _time: number) => {
      setIndex(index);
    };
    runContext.subscribe("run-command", handler);
    return () => runContext.unsubscribe("run-command", handler);
  }, [runContext]);

  return (
    <div className={styles.container}>
      {index}
      {props.script.map((command, i) => {
        const { keys, modifierKeys } = extractKeys(command.command);
        return (
          <button
            className={styles.line}
            data-active={i <= index}
            key={i}
            onClick={() => props.moveToIndex(i)}
          >
            <div className={styles.left}>
              {modifierKeys.map((key, i) => (
                <div className={styles.key} key={i}>
                  {key}
                </div>
              ))}
            </div>
            <div className={styles.right}>
              {keys.map((key, i) => (
                <div className={styles.key} key={i}>
                  {key}
                </div>
              ))}

              {typeof command.times === "number" && <div>x{command.times}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
};
