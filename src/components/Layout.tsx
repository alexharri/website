import React from "react";
import { ToggleDarkMode } from "./ToggleDarkMode/ToggleDarkMode";
import styles from "./Layout.module.scss";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerSection}>
            <Link href="/" className={styles.homeLink}>
              alexharri
            </Link>
          </div>
          <div className={styles.headerSection}>
            <ToggleDarkMode />
          </div>
        </div>
      </header>
      <div className={styles.headerBorder} />
      <div className={styles.content}>{props.children}</div>
    </>
  );
};
