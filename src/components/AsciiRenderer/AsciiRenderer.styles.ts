import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const AsciiRendererStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    pointer-events: auto;
    position: relative;
    transition: background 0.5s;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  `,

  content: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  `,

  pre: styled.css`
    font-family: ${cssVariables.fontMonospace};
    font-size: 14px;
    white-space: pre;
    margin: 0;
    padding: 0;
    line-height: 1;
    font-variant-ligatures: none;
  `,
});
