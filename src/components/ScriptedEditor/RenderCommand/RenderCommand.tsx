import { ArrowIcon16 } from "../../Icon/ArrowIcon16";
import { BackspaceIcon18 } from "../../Icon/BackspaceIcon18";
import { MetaIcon18 } from "../../Icon/MetaIcon18";
import { OptionIcon18 } from "../../Icon/OptionIcon18";
import { ShiftIcon18 } from "../../Icon/ShiftIcon18";
import { ScriptCommand } from "../types/scriptTypes";
import styles from "./RenderCommand.module.scss";

function escapeText(text: string) {
  return text.replace(/\n/g, "\\n");
}

const modifierKeys = new Set(["Command", "Shift", "Option", "Ctrl"]);

function isModifier(key: string) {
  return modifierKeys.has(key);
}

function getKeyLabel(key: string) {
  switch (key) {
    case "Command":
      return <MetaIcon18 />;
    case "Option":
      return <OptionIcon18 />;
    case "Shift":
      return <ShiftIcon18 />;
    case "Right":
      return <ArrowIcon16 direction="right" />;
    case "Left":
      return <ArrowIcon16 direction="left" />;
    case "Up":
      return <ArrowIcon16 direction="up" />;
    case "Down":
      return <ArrowIcon16 direction="down" />;
    case "Backspace":
      return <BackspaceIcon18 />;
    default:
      return key;
  }
}

function extractKeys(command: string): { modifierKeys: string[]; keys: string[] } {
  const keys: string[] = [];
  const modifierKeys: string[] = [];

  for (const key of command.split(" ")) {
    const list: React.ReactNode[] = isModifier(key) ? modifierKeys : keys;
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
        <div className={styles.left}>Type</div>
        <div className={styles.right}>
          <code className={styles.key}>{escapeText(command.text)}</code>
        </div>
      </Container>
    );
  }

  if (command.command === "Select Word") {
    return (
      <Container onClick={onClick}>
        <div className={styles.left}>Select</div>
        <div className={styles.right}>
          <code className={styles.key}>{escapeText(command.word)}</code>
        </div>
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
