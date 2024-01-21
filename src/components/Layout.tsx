import React from "react";
import Link from "next/link";
import { useStyles } from "../utils/styles";
import { LayoutStyles } from "./Layout.styles";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  const s = useStyles(LayoutStyles);
  return (
    <>
      <header className={s("header")}>
        <div className={s("headerContent")}>
          <div className={s("headerSection")}>
            <Link href="/" className={s("link", { home: true })}>
              Alex Harri
            </Link>
          </div>
          <div className={s("headerSection")}>
            <Link href="/" className={s("link")}>
              Home
            </Link>
            <Link href="/blog" className={s("link")}>
              Blog
            </Link>
          </div>
        </div>
      </header>
      <div className={s("headerBorder")} />
      <div className={s("content")}>{props.children}</div>
    </>
  );
};
