import { ScriptCommand } from "../types/scriptTypes";
import styles from "./RenderCommand.module.scss";

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
    case "Backspace":
      return "⌫";
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

interface ContainerProps {
  children: React.ReactNode;
  onClick: () => void;
}

const Container = ({ children, onClick }: ContainerProps) => {
  return (
    <div className={styles.container} onClick={onClick}>
      {children}
    </div>
  );
};

interface Props {
  command: ScriptCommand;
  onClick: () => void;
}

export const RenderCommand = (props: Props) => {
  const { command, onClick } = props;

  if (command.command === "Type") {
    return (
      <Container onClick={onClick}>
        <div className={styles.left} />
        Type&nbsp;<code className={styles.key}>{command.text}</code>
      </Container>
    );
  }

  if (command.command === "Select Word") {
    return (
      <Container onClick={onClick}>
        <div className={styles.left} />
        Select&nbsp;<code className={styles.key}>{command.word}</code>
      </Container>
    );
  }

  const { keys, modifierKeys } = extractKeys(command.command);

  return (
    <Container onClick={onClick}>
      <div className={styles.left}>
        {modifierKeys.map((key, i) => (
          <code className={styles.key} key={i}>
            {key}
          </code>
        ))}
      </div>
      <div className={styles.right}>
        {keys.map((key, i) => (
          <code className={styles.key} key={i}>
            {key}
          </code>
        ))}

        {typeof command.times === "number" && <div>x{command.times}</div>}
      </div>
    </Container>
  );
};
