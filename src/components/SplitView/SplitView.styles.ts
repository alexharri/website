import { hexToRgbaString } from "../../utils/color";
import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    position: relative;
  `,

  divider: styled.css`
    background: ${theme.background};
    position: absolute;
    top: 0;
    left: 50%;
    bottom: 0;
    width: 20px;
    z-index: 20;
    transform: translateX(50vw);
    transition: all 0.5s;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid ${theme.medium400};
    border-right: 1px solid ${theme.medium400};

    &--dragging {
      cursor: grabbing;
    }

    & *[data-handle] {
      width: 4px;
      height: 40px;
      background: ${theme.medium700};
      border-radius: 2px;
      pointer-events: none;
      transition: all 0.3s;
    }

    &:hover {
      & *[data-handle] {
        background: ${theme.text400};
        height: 64px;
      }
    }
  `,

  leftPanel: styled.css`
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
    background: ${theme.background200};

    &--transparent {
      background: ${hexToRgbaString(theme.background200, 0.5)};
    }
  `,

  leftPanelInner: styled.css`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    transform: translateX(0);
    transition: all 0.5s;
  `,

  rightPanel: styled.css`
    width: 100%;
    margin-left: auto;
    transform: translateX(100%);
    overflow: hidden;
    transition: all 0.5s;
    position: relative;
  `,

  rightPanelInner: styled.css`
    position: absolute;
    top: 0;
    left: 50%;
    width: 100%;
    transform: translateX(-75%);
    transition: all 0.5s;
  `,
});
