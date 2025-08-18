import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const CONTENT_WIDTH = 1080;
export const BREAKPOINT = 1200;

export default ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: relative;
    max-width: 100%;
    width: ${CONTENT_WIDTH}px;
    margin: 0 auto;
    border: 1px solid ${theme.medium400};
    border-radius: 16px;
    overflow: hidden;

    @media (max-width: ${BREAKPOINT}px) {
      margin: 0 -${cssVariables.contentPadding}px;
      border-radius: 0;
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
    height: 72px;
    padding-bottom: 16px;
    align-items: center;
    margin-top: -16px;
  `,
});
