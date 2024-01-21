import { StyleOptions } from "../../utils/styles";

export const AboutMeStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    display: flex;
    gap: 32px;

    @media (max-width: 500px) {
      flex-direction: column;
      gap: 24px;
    }
  `,

  left: styled.css`
    margin: 0;
  `,

  right: styled.css`
    h2 {
      margin: 0;
    }
  `,

  image: styled.css`
    width: 96px;
    height: auto;
    border-radius: 50%;
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
});
