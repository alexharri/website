import { StyleOptions } from "../../utils/styles";

const W = 48;
const H = 24;
const OFF = 3;

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
    background-color: ${theme.medium700};
    position: relative;
    transition: background-color 0.3s;

    &--checked {
      background-color: ${theme.blue};
    }
  `,

  circle: styled.css`
    width: ${H - OFF * 2}px;
    height: ${H - OFF * 2}px;
    position: absolute;
    top: ${OFF}px;
    left: ${OFF}px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;

    &--checked {
      transform: translateX(${W - H}px);
    }
  `,

  label: styled.css`
    color: ${theme.text};
    font-size: 15px;
    cursor: pointer;
  `,
});
