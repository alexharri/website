import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: relative;
    display: flex;
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    border-radius: 6px;
    padding: 2px;
    overflow: hidden;
  `,

  indicator: styled.css`
    position: absolute;
    top: 2px;
    bottom: 2px;
    background: ${theme.background500};
    border-radius: 4px;
    transition: transform 0.2s ease, width 0.2s ease;
    z-index: 1;
  `,

  option: styled.css`
    position: relative;
    background: transparent;
    border: none;
    color: ${theme.text400};
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    z-index: 2;
    transition: color 0.2s ease;
    white-space: nowrap;

    &:hover {
      color: ${theme.text700};
    }

    &--active {
      color: ${theme.text};
    }
  `,
});