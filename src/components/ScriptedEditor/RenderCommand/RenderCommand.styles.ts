import { cssVariables } from "../../../utils/cssVariables";
import { StyleOptions } from "../../../utils/styles";

export const RenderCommandStyles = ({ styled, theme }: StyleOptions) => ({
  containerInline: styled.css`
    border: none;
    color: ${theme.text};
    padding: 0 0;
    display: inline-flex;
    margin: 0 3px;
  `,

  container: styled.css`
    border: none;
    color: ${theme.text};
    padding: 0 0;
    display: flex;
    cursor: pointer;
    height: 38px;
    margin-bottom: 16px;
    border-bottom: 1px solid ${theme.background};

    &:first-of-type {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }

    &:last-of-type {
      border-bottom: none;
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
  `,

  left: styled.css`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-right: 8px;
    width: 92px;
    gap: 8px;
  `,

  right: styled.css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,

  key: styled.css`
    border: 1px solid ${theme.medium500};
    font-family: ${cssVariables.fontMonospace};
    font-size: 16px;
    line-height: 1;
    background: ${theme.medium400};
    color: ${theme.text};
    white-space: pre;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    user-select: all;

    &[data-faded="true"] {
      border: 1px solid ${theme.background700};
      background: ${theme.background300};
      color: ${theme.text600};
    }

    &[data-small] {
      font-size: 13px;
      min-width: 24px;
      padding: 2px 4px;

      svg {
        width: 14px;
        height: 14px;
      }
    }
  `,

  keyLabel: styled.css`
    width: 1px;
    margin-right: -1px;
    overflow: hidden;
    opacity: 0;
  `,
});
