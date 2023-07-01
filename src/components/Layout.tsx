import React from "react";
import { ToggleDarkMode } from "./ToggleDarkMode/ToggleDarkMode";
import Link from "next/link";
import { DISABLE_LIGHT_MODE } from "../utils/colorMode";
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
            <Link href="/" className={s("homeLink")}>
              alexharri
            </Link>
          </div>
          <div className={s("headerSection")}>{!DISABLE_LIGHT_MODE && <ToggleDarkMode />}</div>
        </div>
      </header>
      <div className={s("headerBorder")} />
      <div className={s("content")}>{props.children}</div>
    </>
  );
};
