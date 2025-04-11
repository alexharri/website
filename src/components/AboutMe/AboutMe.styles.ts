import { StyleOptions } from "../../utils/styles";

export const AboutMeStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    display: flex;
    gap: 32px;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 24px;
    }
  `,

  left: styled.css`
    margin: 0;
  `,

  right: styled.css`
    border: 1px solid ${theme.medium400};
    background: ${theme.background100};
    padding: 16px;
    border-radius: 8px;
    position: relative;

    h2 {
      margin: 0;
    }
    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }

    &:before,
    &:after {
      content: "";
      position: absolute;
      top: 29px;
      left: 0;
      right: 100%;
      transform: translate(-50%, -50%) rotate(45deg);

      @media (max-width: 640px) {
        left: 64px;
        bottom: 100%;
        top: 0;
      }
    }
    &:before {
      width: 16px;
      height: 16px;
      background: ${theme.medium400};
      z-index: -1;
    }
    &:after {
      width: 14px;
      height: 14px;
      background: ${theme.background100};
      z-index: 10;
    }
  `,

  image: styled.css`
    width: 128px;
    height: auto;
    border-radius: 8px;
  `,

  links: styled.css`
    margin-top: 16px;
    display: flex;
    gap: 12px;
    align-items: center;

    [data-dot] {
      display: flex;
      width: 5px;
      height: 5px;
      background: ${theme.medium500};
      border-radius: 50%;
    }
  `,

  dot: styled.css`
    &:before {
      content: "•";
    }
    margin: auto 12px;
    display: inline-block;
    color: ${theme.text400};
    transform: scale(1.4);
  `,
});
