import { cssVariables } from "../../../utils/cssVariables";
import { StyleOptions } from "../../../utils/styles";

export const AsciiRendererStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: background 0.5s;
  `,

  pre: styled.css`
    font-family: ${cssVariables.fontMonospace};
    white-space: pre;
    margin: 0;
    padding: 0;
    font-variant-ligatures: none;
  `,
});
