import { ScriptCommand } from "./scriptTypes";
import styles from "./ScriptCommands.module.scss";

interface Props {
  index: number;
  moveToIndex: (index: number) => void;
  script: ScriptCommand[];
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
  return (
    <div className={styles.container}>
      {props.script.map((command, i) => {
        const { keys, modifierKeys } = extractKeys(command.command);
        return (
          <button className={styles.line} key={i} onClick={() => props.moveToIndex(i)}>
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
