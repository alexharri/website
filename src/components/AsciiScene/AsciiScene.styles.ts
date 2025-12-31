import { StyleOptions } from "../../utils/styles";

export default (width: number, breakpoint: number) =>
  ({ styled, theme }: StyleOptions) => ({
    container: styled.css`
      position: relative;
      max-width: 100%;
      width: ${width}px;
      margin: 0 auto;
      border: 1px solid ${theme.medium400};
      overflow: hidden;

      @media (max-width: ${breakpoint}px) {
        border: none;
        min-width: 100vw;
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
      height: 56px;
      align-items: center;
    `,
  });
