// Generated with Claude, with help from me

import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

const MARGIN = 4;

export default ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: relative;
    display: flex;
    background: rgba(${theme.backgroundRgb}, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid ${theme.medium500};
    border-radius: 100px;
    overflow: hidden;
  `,

  indicator: styled.css`
    position: absolute;
    top: ${MARGIN}px;
    bottom: ${MARGIN}px;
    background: ${theme.medium400};
    border-radius: 20px;
    transition: transform 0.2s ease, width 0.2s ease;
    z-index: 1;
  `,

  option: styled.css`
    font-family: ${cssVariables.fontFamily};
    font-size: 15px;
    line-height: 24px;
    color: ${theme.text400};
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    z-index: 2;
    transition: color 0.2s ease;
    white-space: nowrap;
    margin: 0 -2px;

    &:first-of-type {
      margin-left: ${MARGIN}px;
    }
    &:last-of-type {
      margin-right: ${MARGIN}px;
    }

    &--active {
      color: ${theme.text};
    }
  `,
});
