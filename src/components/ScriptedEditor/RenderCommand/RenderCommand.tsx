import React from "react";
import { ArrowIcon16 } from "../../Icon/ArrowIcon16";
import { BackspaceIcon18 } from "../../Icon/BackspaceIcon18";
import { ControlIcon18 } from "../../Icon/ControlIcon18";
import { MetaIcon18 } from "../../Icon/MetaIcon18";
import { OptionIcon18 } from "../../Icon/OptionIcon18";
import { ShiftIcon18 } from "../../Icon/ShiftIcon18";
import { ScriptCommand } from "../types/scriptTypes";
import styles from "./RenderCommand.module.scss";

function escapeText(text: string) {
  return text.replace(/\n/g, "\\n");
}

const modifierKeys = new Set(["Command", "Shift", "Option", "Control", "Alt"]);

function isModifier(key: string) {
  return modifierKeys.has(key);
}

interface RenderableKey {
  label: string;
  render: React.ReactNode;
}

function getKeyLabel(key: string) {
  const withLabel = (render: React.ReactNode) => ({ label: key, render });
  switch (key) {
    case "Control":
      return withLabel(<ControlIcon18 />);
    case "Command":
      return withLabel(<MetaIcon18 />);
    case "Option":
      return withLabel(<OptionIcon18 />);
    case "Shift":
      return withLabel(<ShiftIcon18 />);
    case "Right":
      return withLabel(<ArrowIcon16 direction="right" />);
    case "Left":
      return withLabel(<ArrowIcon16 direction="left" />);
    case "Up":
      return withLabel(<ArrowIcon16 direction="up" />);
    case "Down":
      return withLabel(<ArrowIcon16 direction="down" />);
    case "Backspace":
      return withLabel(<BackspaceIcon18 />);
    default:
      return withLabel(key);
  }
}

function extractKeys(command: string): { modifierKeys: RenderableKey[]; keys: RenderableKey[] } {
  const keys: RenderableKey[] = [];
  const modifierKeys: RenderableKey[] = [];

  for (let key of command.split(" ")) {
    const list: RenderableKey[] = isModifier(key) ? modifierKeys : keys;
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
            {key.render}
          </code>
        ))}
      </div>
      <div className={styles.right}>
        {keys.map((key, i) => (
          <code className={styles.key} key={i}>
            {key.render}
          </code>
        ))}

        {typeof command.times === "number" && <div>x{command.times}</div>}
      </div>
    </Container>
  );
};

interface RenderTextCommandProps {
  children: React.ReactNode;
  faded?: boolean;
  small?: boolean;
  noMarginLeft?: boolean;
}

export const RenderTextCommand = ({
  children,
  noMarginLeft,
  faded,
  small,
}: RenderTextCommandProps) => {
  if (typeof children !== "string") {
    return "<Invalid command>";
  }

  const { keys, modifierKeys } = extractKeys(children);
  const allKeys = [...modifierKeys, ...keys];

  return (
    <span className={styles.containerInline} style={{ marginLeft: noMarginLeft ? 0 : undefined }}>
      {allKeys.map((key, i) => (
        <React.Fragment key={i}>
          {typeof key.render !== "string" && <span className={styles.keyLabel}>{key.label}</span>}
          <code className={styles.key} title={key.label} data-faded={faded} data-small={small}>
            {key.render}
          </code>
          {i === allKeys.length - 1 ? null : <>&nbsp;</>}
        </React.Fragment>
      ))}
    </span>
  );
};
