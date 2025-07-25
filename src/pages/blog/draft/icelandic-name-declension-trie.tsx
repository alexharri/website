import React from "react";
import { createPage } from "../[slug]";
import { getPostProps, getSlugFromFilePath } from "../../../utils/blogPageUtils";
import { StyleOptions, useStyles } from "../../../utils/styles";
import { cssVariables } from "../../../utils/cssVariables";

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    display: inline-flex;
    align-items: center;
  `,

  node: styled.css`
    font-family: ${cssVariables.fontMonospace};
    font-weight: 500;
    border: 2px solid ${theme.text200};
    display: inline-block;
    padding: 0px 10px;
    margin: 1px 0;
    font-size: 18px;
    line-height: 30px;
    border-radius: 12px;
  `,

  arrow: styled.css`
    position: relative;
    width: 20px;
    height: 2px;
    background-color: ${theme.text};
    margin-right: 3px;

    &:before {
      content: "";
      position: absolute;
      right: -2px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 10px solid ${theme.text};
    }
  `,
});

function Node({ children }: { children: string }) {
  const s = useStyles(styles);
  const parts = children.split("->");
  return (
    <span className={s("wrapper")}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className={s("node")}>{part}</span>
          {i === parts.length - 1 ? null : <span className={s("arrow")} />}
        </React.Fragment>
      ))}
    </span>
  );
}

export default createPage({
  Node,
});

export const getStaticProps = async () => {
  const slug = getSlugFromFilePath(import.meta.url);
  return getPostProps({ params: { slug } });
};
