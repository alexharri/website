import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  controls: styled.css`
    position: absolute;
    top: 16px;
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

  select: styled.css`
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    color: ${theme.text};
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    min-width: 100px;

    &:hover {
      background: ${theme.background500};
      border-color: ${theme.text700};
    }

    option {
      background: ${theme.background300};
      color: ${theme.text};
    }
  `,

  slider: styled.css`
    width: 100px;
    height: 4px;
    border-radius: 2px;
    background: ${theme.background300};
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${theme.text};
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${theme.text};
      cursor: pointer;
      border: none;
    }
  `,

  sliderValue: styled.css`
    font-size: 12px;
    color: ${theme.text400};
    min-width: 30px;
    text-align: center;
  `,

  controlGroup: styled.css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  `,

  sliderGroup: styled.css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  `,

  sliderContainer: styled.css`
    display: flex;
    align-items: center;
    gap: 6px;
  `,

  sliderButton: styled.css`
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    color: ${theme.text};
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background: ${theme.background500};
      border-color: ${theme.text700};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
});