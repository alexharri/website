import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

const space = cssVariables.contentWidth - cssVariables.contentPadding * 2;

export const postCarouselItemGap = 16;
export const postCarouselItemWidth = space / 2 - postCarouselItemGap / 2;

export const PostCarouselStyles = ({ styled }: StyleOptions) => ({
  container: styled.css``,

  inner: styled.css`
    display: flex;
    gap: ${postCarouselItemGap}px;
    transition: transform 0.4s;

    @media (max-width: 900px) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      transition: none;
    }

    @media (max-width: 670px) {
      grid-template-columns: repeat(1, 1fr);
    }
  `,

  item: styled.css`
    @media (min-width: 901px) {
      min-width: ${postCarouselItemWidth}px;
      max-width: ${postCarouselItemWidth}px;
      transition: opacity 0.4s;

      &--outOfBounds {
        opacity: 0.5;
        &:hover {
          opacity: 0.7;
        }

        cursor: pointer;
        * {
          pointer-events: none;
        }
      }
    }

    @media (max-width: 900px) {
      display: flex;
      justify-content: stretch;
      align-content: stretch;
    }
  `,
});
