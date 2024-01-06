import React from "react";
import { StyleOptions, useStyles } from "../../utils/styles";

const NoteStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    background: ${theme.background100};
    padding: 12px 16px;
    border-radius: 8px;
    margin: 32px -16px;

    p {
      font-size: 16px;
      color: ${theme.text700};
      margin: 0 0 16px;

      &:last-of-type {
        margin-bottom: 0;
      }
    }
  `,
});

interface Props {
  children: React.ReactNode;
}

export const Note = (props: Props) => {
  const s = useStyles(NoteStyles);

  const content = React.Children.map(props.children, (child) => {
    if (typeof child === "object" && child && "type" in child && child.type === "p") {
      return child;
    }
    return <p>{child}</p>;
  });

  return <div className={s("container")}>{content}</div>;
};
