import { StyleOptions } from "../utils/styles";

const W = 100;

export default ({ styled }: StyleOptions) => ({
  normalLabel: styled.css`
    display: flex;
    align-items: center;
    gap: 3px;
  `,

  normal: styled.css`
    canvas {
      width: ${W}px;
      height: ${W}px;
      touch-action: none;
    }
  `,

  axis: styled.css`
    width: ${W}px;
    height: ${W}px;
    border-radius: 50%;

    &--red {
      background: red;
    }
  `,
});
