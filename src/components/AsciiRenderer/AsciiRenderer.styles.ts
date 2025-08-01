import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const AsciiRendererStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    pointer-events: none;
  `,

  pre: styled.css`
    font-family: ${cssVariables.fontMonospace};
    font-size: 14px;
    white-space: pre;
    margin: 0;
    padding: 0;
    line-height: 1;
    color: rgb(103, 80, 179);
    font-variant-ligatures: none;
  `,
});
