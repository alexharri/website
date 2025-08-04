import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    position: relative;
  `,

  controls: styled.css`
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
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

  wrapper: styled.css`
    position: relative;
    margin: 0 -${cssVariables.contentPadding}px;
  `,

  border: styled.css`
    background: ${theme.background};
    position: absolute;
    top: 0;
    left: 50%;
    bottom: 0;
    width: 16px;
    z-index: 50;
    transform: translateX(50vw);
    transition: all 0.5s;

    &--split {
      transform: translateX(-50%);
    }
  `,

  ascii: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    overflow: hidden;
    user-select: none;
    pointer-events: none;
    transition: all 0.5s;

    &--split {
      transform: translateX(-50vw);
    }
  `,

  asciiInner: styled.css`
    position: absolute;
    background: ${theme.background200};
    top: 0;
    bottom: 0;
    left: 50%;
    width: 100vw;
    transform: translateX(-50%);
    transition: all 0.5s;

    &--split {
      transform: translateX(-25%);
    }
  `,

  canvas: styled.css`
    width: 50vw;
    margin-left: auto;
    transform: translateX(100%);
    overflow: hidden;
    transition: all 0.5s;
    position: relative;

    &--split {
      transform: translateX(0px);
    }
  `,

  canvasInner: styled.css`
    position: absolute;
    top: 0;
    left: 50%;
    width: 100vw;
    transform: translateX(-75%);
    transition: all 0.5s;

    &--split {
      transform: translateX(-50%);
    }
  `,

  button: styled.css`
    background: ${theme.background300};
    border: 1px solid ${theme.text400};
    color: ${theme.text};
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: ${theme.background500};
      border-color: ${theme.text700};
    }

    &--active {
      background: ${theme.background700};
      border-color: ${theme.text800};
    }
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
});
