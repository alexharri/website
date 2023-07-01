import { StyleOptions } from "../utils/styles";

export const ImageStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    margin: 32px 0 40px;
    position: relative;

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

    &--wide {
      margin-left: -24px;
      margin-right: -24px;
    }

    @media (max-width: 800px) {
      margin-left: 0;
      margin-right: 0;
    }
  `,

  image: styled.css`
    border-radius: 8px;
    border: 2px solid #1f4f76;
    margin: 0;
  `,
});
