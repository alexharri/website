import React from "react";

interface Props {
  children: React.ReactNode;
}

export const Layout = (props: Props) => {
  return <div style={{ padding: 64 }}>{props.children}</div>;
};
