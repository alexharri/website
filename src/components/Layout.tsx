import React from "react";
import Link from "next/link";
import { useStyles } from "../utils/styles";
import { LayoutStyles } from "./Layout.styles";
import { Footer } from "./Footer/Footer";

interface Props {
  constrainWidth?: boolean;
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  const s = useStyles(LayoutStyles);

  const { constrainWidth = false } = props;

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
            <Link href="/about" className={s("link")}>
              About
            </Link>
            <Link href="/blog" className={s("link")}>
              Blog
            </Link>
          </div>
        </div>
      </header>
      <div className={s("headerBorder")} />
      <div className={s("content", { constrainWidth })}>{props.children}</div>
      <Footer />
    </>
  );
};
