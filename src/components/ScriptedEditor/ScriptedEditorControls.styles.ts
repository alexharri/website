import { StyleOptions } from "../../utils/styles";

export const ScriptedEditorControlsStyles = ({ styled }: StyleOptions) => ({
  slideIn: styled.css`
    transform: translateX(16px);
    opacity: 0;
    transition: all 0.3s, opacity 0.4s, transform 0.5s;

    &[data-nth="2"] {
      transition-delay: 0.04s;
    }
    &[data-nth="3"] {
      transition-delay: 0.08s;
    }

    &[data-active="true"] {
      opacity: 1;
      transform: translateX(0);
    }
    &[data-active="false"] {
      pointer-events: none;
    }
  `,

  bigButtonWrapper: styled.css`
    position: relative;
    display: inline-block;
    margin-right: 16px;
    margin-bottom: 16px;

    &:after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -12px;
      height: 24px;
      z-index: 0;
      border: 2px solid var(--color-blue-200);
      background: var(--color-dark-blue-400);
      border-radius: 8px;
    }

    &[data-down="true"] > div {
      transform: translateY(5px);
      border-color: var(--color-blue-700);
      color: var(--color-blue-700);
      text-shadow: 0 0 12px rgba(var(--color-blue-rgb), 0.8);
      box-shadow: inset 0 0 16px rgba(var(--color-blue-rgb), 0.4);
    }
    &:active > div {
      transform: translateY(8px);
    }

    @media (max-width: 340px) {
      margin-right: 8px;
    }
  `,

  bigButton: styled.css`
    color: var(--color-blue);
    font-weight: bold;
    border-radius: 8px;
    position: relative;
    z-index: 1;
    padding: 12px 12px;
    font-size: 20px;
    border: 2px solid var(--color-blue);
    background: var(--color-background);
    transition: transform 0.15s, border-color 0.2s, color 0.2s, text-shadow 0.15s, box-shadow 0.15s;

    @media (max-width: 500px) {
      font-size: 16px;
      padding: 8px;
    }
  `,

  textButton: styled.css`
    color: var(--color-blue);
    font-weight: bold;
    border-radius: 8px;
    font-size: 16px;
    padding: 12px 16px;
    margin-top: 8px;
    margin-right: 4px;
    border: 1px solid transparent;

    &[data-down="true"] {
      border-color: var(--color-blue);
      color: var(--color-blue-700);
    }

    @media (max-width: 500px) {
      font-size: 14px;
      padding: 8px 12px;
    }
  `,
});
