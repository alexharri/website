import React from "react";
import { StyleOptions, useStyles } from "../../utils/styles";

const NoteStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    background: ${theme.background200};
    padding: 12px 16px;
    border-radius: 8px;
    margin: 32px -16px;

    & > *:first-child {
      margin-top: 0;
    }

    &--warning {
      background: #23200f;
      border: 1px solid #5f582d;
    }

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

const doNotWrapInP = new Set<unknown>(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);

interface Props {
  children: React.ReactNode;
  variant?: "warning";
}

export const Note = (props: Props) => {
  const s = useStyles(NoteStyles);

  const content = React.Children.map(props.children, (child) => {
    if (typeof child === "object" && child && "type" in child && doNotWrapInP.has(child.type)) {
      return child;
    }
    return <p>{child}</p>;
  });

  return (
    <div className="flow">
      <div className={s("container", { warning: props.variant === "warning" })}>{content}</div>
    </div>
  );
};
