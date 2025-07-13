import { cssVariables } from "../utils/cssVariables";
import { StyleOptions } from "../utils/styles";

export const ImageStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    margin: 40px auto 40px;
    position: relative;
    max-width: 100%;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transform: translateY(4px);
      background: #0e1e2b;
      z-index: -1;
      border-radius: 8px;
      border: 2px solid #1a364d;
    }

    &--plain {
      &:before {
        display: none;
      }
    }

    &--fullWidth,
    &--noMargin {
      margin-left: -${cssVariables.contentPadding}px;
      margin-right: -${cssVariables.contentPadding}px;
      max-width: calc(100% + ${cssVariables.contentPadding * 2}px);
    }

    &--allowScroll {
      overflow-x: scroll;
    }
  `,

  image: styled.css`
    border-radius: 8px;
    border: 2px solid #1f4f76;
    margin: 0 auto;
    max-width: 100%;
    display: block;

    &--plain {
      border: none;
      border-radius: 0;
    }
  `,
});
