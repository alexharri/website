import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const FooterStyles = ({ styled, theme }: StyleOptions) => ({
  footer: styled.css`
    width: 100vw;
    padding: 64px 64px 80px;
    background: ${theme.background200};

    @media (max-width: 750px) {
      padding: 40px 40px 64px;
    }

    @media (max-width: 650px) {
      padding: 32px 32px 64px;
    }
  `,

  inner: styled.css`
    margin: 0 auto;
    width: ${cssVariables.contentWidth - cssVariables.contentPadding * 2}px;
    max-width: 100%;
  `,

  title: styled.css`
    font-size: 18px;
    color: ${theme.text};
    font-weight: 600;
    margin: 0 0 6px;
  `,

  copyright: styled.css`
    color: ${theme.text400};
    font-size: 14px;
    margin: 0;
  `,

  grid: styled.css`
    display: flex;
    gap: 32px;

    & > * {
      flex-basis: 0;
      flex-grow: 1;

      &:first-child {
        flex-basis: 0;
        flex-grow: 2;
      }
    }

    @media (max-width: 650px) {
      flex-wrap: wrap;

      section:first-child {
        flex-basis: 100%;
      }
    }
  `,

  link: styled.css`
    margin: 0 0 4px;

    a {
      display: flex;
      align-items: center;
      color: ${theme.text};
      font-size: 16px;
    }

    svg {
      margin-left: -30px;
      width: 18px;
      height: 18px;
      margin-right: 12px;
      color: ${theme.text700};

      @media (max-width: 650px) {
        margin-left: 0;
      }
    }
  `,

  sectionTitle: styled.css`
    color: ${theme.text400};
    font-size: 16px;
    margin: 0 0 8px;
  `,
});
