import { cssVariables } from "../utils/cssVariables";
import { StyleOptions } from "../utils/styles";

export const LayoutStyles = ({ styled, theme }: StyleOptions) => ({
  header: styled.css`
    position: fixed;
    z-index: 1000;
    background: ${theme.headerBackground};
    backdrop-filter: blur(8px);
    top: 0;
    left: 0;
    right: 0;
  `,

  headerBorder: styled.css`
    height: 1px;
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    background: ${theme.headerBorderBackground};
    backdrop-filter: blur(8px);
  `,

  headerContent: styled.css`
    justify-content: space-between;
    padding: 12px 16px;
    width: 750px;
    max-width: 100%;
    display: flex;
    margin: 0 auto;
  `,

  headerSection: styled.css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,

  link: styled.css`
    color: ${theme.text};
    font-size: 16px;
    line-height: 24px;
    padding: 0 8px;

    &--home {
      font-size: 18px;
      font-weight: 600;
      &:hover {
        text-decoration: none;
      }
    }
  `,

  content: styled.css`
    width: ${cssVariables.contentWidth}px;
    max-width: 100%;
    margin: 0 auto;
    padding: 128px ${cssVariables.contentPadding}px 64px;
    min-height: calc(100vh - 24px);

    @media (max-width: 800px) {
      padding-top: 80px;
      width: auto;
    }
  `,
});
