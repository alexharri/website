import React from "react";
import { ToggleDarkMode } from "./ToggleDarkMode/ToggleDarkMode";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  return (
    <div style={{ padding: 64 }}>
      <ToggleDarkMode />
      {props.children}
    </div>
  );
};
