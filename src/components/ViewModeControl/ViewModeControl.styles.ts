import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  viewModeControl: styled.css`
    position: absolute;
    bottom: 16px;
    left: 50%;
    z-index: 100;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    align-items: center;
    background: rgba(${theme.backgroundRgb}, 0.9);
    backdrop-filter: blur(8px);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${theme.text400};
    font-size: 14px;
  `,

  label: styled.css`
    font-size: 12px;
    color: ${theme.text400};
  `,
});