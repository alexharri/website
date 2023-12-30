import { cssVariables } from "../../../utils/cssVariables";
import { StyleOptions } from "../../../utils/styles";

export const ScriptNavigationStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 348px; // SCRIPT_NAVIGATION_WIDTH
    background: ${theme.background500};
    padding: 64px 8px 24px;
    overflow: hidden;
    color: white;
    z-index: 10;
  `,

  containerMobile: styled.css`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 214px /* SCRIPT_NAVIGATION_DRAWER_HEIGHT */;
    background: ${theme.background500};
    padding: 64px 8px 24px;
    overflow: hidden;
    color: white;
    z-index: 10;
    border-radius: 12px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 0 16px 4px rgba(${theme.backgroundRgb}, 0.5),
      0 0 40px rgba(${theme.backgroundRgb}, 0.5);
  `,

  scroll: styled.css`
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transition: transform 0.5s;

    @media (max-width: 1180px /* SCRIPT_NAVIGATION_BREAKPOINT */) {
      top: 74px;
    }
  `,

  command: styled.css`
    overflow: hidden;
    transition: opacity 0.5s;

    @media (max-width: 1180px /* SCRIPT_NAVIGATION_BREAKPOINT */) {
      margin: 0 auto;
      width: 348px; // SCRIPT_NAVIGATION_WIDTH
    }
  `,

  activeCommandHighlight: styled.css`
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 48px;
    background: ${theme.background700};
    transform: translateY(-100%) translateY(11px);

    @media (max-width: 1180px /* SCRIPT_NAVIGATION_BREAKPOINT */) {
      top: 74px;
    }
  `,

  moveButtonWrapper: styled.css`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: ${theme.background300};
    border-top: 2px solid ${theme.background500};
    padding-bottom: 32px;
  `,

  moveButton: styled.css`
    flex-basis: 0;
    flex-grow: 1;
    height: calc(56px);
    color: ${theme.blue700};
    background: transparent;
    font-size: calc(18px);
    font-family: ${cssVariables.fontMonospace};

    &:first-of-type {
      border-right: 2px solid ${theme.background500};
    }
  `,

  arrowKeyHint: styled.css`
    display: flex;
    opacity: 0;
    color: ${theme.text400};
    font-size: 16px;
    transition: opacity 0.7s;

    &[data-active="true"] {
      opacity: 1;
    }

    span:first-of-type {
      min-width: 100px;
      padding-right: 8px;
      text-align: right;
    }
  `,

  arrowIcon: styled.css`
    svg {
      width: 14px;
      height: 14px;
    }
  `,
});
