import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const AsciiRendererStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    pointer-events: auto;
    position: relative;
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

  visualizationLayer: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: -1;
  `,

  samplingPoint: styled.css`
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  `,
});
