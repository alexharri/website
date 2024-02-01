import { StyleOptions } from "../../utils/styles";

export const StaticCodeBlockStyles = ({ styled, theme }: StyleOptions) => ({
  outerWrapper: styled.css`
    position: relative;
    margin: 0 -24px;
  `,

  wrapper: styled.css`
    background: ${theme.background500};
    border-radius: 4px;
    display: flex;
    overflow: auto;
    position: relative;

    @media (max-width: 800px) {
      border-radius: 0;
    }

    button[data-copied] {
      opacity: 0;
    }
    &:hover button[data-copied],
    button[data-copied="true"] {
      opacity: 1;
    }
  `,

  pre: styled.css`
    white-space: pre;
    line-height: 1.5;
    margin: 0px;
  `,

  copyButton: styled.css`
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 32px;
    padding: 6px;
    height: 32px;
    color: ${theme.text};
    background: rgba(${theme.lightRgb}, 0.05);
    border: 1px solid rgba(${theme.lightRgb}, 0.1);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s;
    z-index: 1;
  `,

  outerContainer: styled.css`
    margin: 14px 0 8px;
    white-space: pre;
    display: flex;
    width: 100%;
    max-width: calc(100vw - 48px);

    &--noHeight {
      height: 0;
    }
  `,

  innerContainer: styled.css`
    position: relative;
  `,

  squiggle: styled.css`
    position: absolute;
    height: 6px;
    left: 0;
    top: -15px;
    user-select: none;
  `,

  injectComment: styled.css`
    display: block;
    position: absolute;
    right: 100%;
    opacity: 0;
  `,

  messageContainer: styled.css`
    border: 1px solid #203142;
    background: ${theme.background300};
    border-top-color: #2a4051;
    border-left-color: #2a4051;
    border-radius: 4px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding: 12px 16px;
    white-space: normal;
    position: relative;
    min-width: 380px;

    &:after {
      content: "";
      position: absolute;
      display: block;
      width: 2px;
      top: -1px;
      left: -1px;
      bottom: -1px;
      z-index: 1;
    }

    &[data-type="error"] {
      &:after {
        background: ${theme.darkRed400};
        border-top: 1px solid #c0172f;
        border-left: 1px solid #c0172f;
      }
    }
    &[data-type="info"] {
      border-radius: 4px;
      &:after {
        display: none;
        background: #2370c6;
        border-top: 1px solid #3080d9;
        border-left: 1px solid #3080d9;
      }
    }

    div {
      font-size: inherit;
      line-height: inherit;
      margin: 0 0 4px;
      display: flex;

      &:last-of-type {
        margin-bottom: 0;
      }
    }
  `,

  fillSpace: styled.css`
    flex-basis: 0;
    flex-grow: 1;
  `,
});
