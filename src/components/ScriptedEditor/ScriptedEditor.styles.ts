import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const ScriptedEditorStyles = ({ styled, keyframes, theme }: StyleOptions) => {
  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translate(-50%, -16px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  `;
  return {
    outerContainer: styled.css`
      transform: translateY(26px) scale(0.95);
      opacity: 0.8;
      transition: transform 0.5s, opacity 0.5s;
      margin: 0 -24px;

      &[data-active="true"] {
        opacity: 1;
        transform: translateY(0) scale(1);
        transition: transform 0.4s, opacity 0.3s;
      }
    `,

    editor: styled.css`
      z-index: 1;
      position: relative;
      border-radius: 8px;
      box-shadow: 0 0 0 0 rgba(35, 156, 255, 0.35);
      transition: box-shadow 0.3s;
      margin-bottom: 16px;

      &[data-focus-inside="true"] {
        transition: box-shadow 0.175s;
        box-shadow: 0 0 0 8px rgba(35, 156, 255, 0.35);
      }
    `,

    exec: styled.css`
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      height: 40px;
      width: 320px;
      padding: 0 8px;
      color: ${theme.text};
      font-size: 20px;
      font-family: ${cssVariables.fontFamily};
      border: 2px solid ${theme.blue};
      background: ${theme.background500};
      border-radius: 4px;
      animation: ${fadeIn} 0.5s;

      &:after {
        content: "";
        display: inline-block;
        height: 24px;
        width: 1px;
        background: currentColor;
      }
    `,
  };
};
