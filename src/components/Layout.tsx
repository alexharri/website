import React from "react";
import { ToggleDarkMode } from "./ToggleDarkMode/ToggleDarkMode";
import styles from "./Layout.module.scss";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  return (
    <>
      <div className={styles.header}>
        <ToggleDarkMode />
      </div>
      <div className={styles.content}>{props.children}</div>
    </>
  );
};
