import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export default (width: number) =>
  ({ styled, theme }: StyleOptions) => ({
    container: styled.css`
      position: relative;
      max-width: 100%;
      width: ${width}px;
      margin: 0 auto;
      outline: 1px solid ${theme.medium400};
      overflow: hidden;
      transition: opacity 0.3s, transform 0.3s;

      &--isPaused {
        opacity: 0.7;
        transform: scale(0.97);
        transition: opacity 0.3s, transform 0.8s;

        @media (max-width: ${cssVariables.mobileWidth}px) {
          transform: scale(1);
          opacity: 0.5;
        }
      }
    `,

    viewModeControl: styled.css`
      position: absolute;
      bottom: 16px;
      left: 50%;
      z-index: 100;
      transform: translateX(-50%);
    `,

    variablesWrapper: styled.css`
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: center;
      gap: 32px;
      height: 64px;
      padding-bottom: 8px;
      align-items: flex-end;

      @media (max-width: ${cssVariables.mobileWidth}px) {
        padding-bottom: 0;
      }
    `,
  });
