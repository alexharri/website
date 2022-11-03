import React from "react";
import { toggleColorMode } from "../utils/colorMode";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  return (
    <div style={{ padding: 64 }}>
      <button onClick={toggleColorMode}>Toggle color mode</button>
      {props.children}
    </div>
  );
};
