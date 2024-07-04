import { StyleOptions } from "../../utils/styles";

const W = 48;
const H = 26;
const OFF = 4;

export default ({ styled, theme }: StyleOptions) => ({
  toggle: styled.css`
    display: flex;
    gap: 8px;
  `,

  pill: styled.css`
    cursor: pointer;
    width: ${W}px;
    height: ${H}px;
    border-radius: ${H / 2}px;
    background-color: ${theme.background};
    border: 1px solid ${theme.medium500};
    position: relative;
    transition: background-color 0.3s, border-color 0.3s;

    &--checked {
      background-color: ${theme.blue400};
      border-color: ${theme.blue400};
    }
  `,

  circle: styled.css`
    width: ${H - OFF * 2}px;
    height: ${H - OFF * 2}px;
    position: absolute;
    top: ${OFF - 1}px;
    left: ${OFF - 1}px;
    background: ${theme.text700};
    border-radius: 50%;
    transition: transform 0.2s;

    &--checked {
      transform: translateX(${W - H}px);
      background: white;
    }
  `,

  label: styled.css`
    color: ${theme.text700};
    font-size: 15px;
    cursor: pointer;
    transition: color 0.3s;

    &:hover,
    &--checked {
      color: ${theme.text};
    }
  `,
});
