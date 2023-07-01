import { StyleOptions } from "../utils/styles";

export const LayoutStyles = ({ styled }: StyleOptions) => ({
  header: styled.css`
    position: fixed;
    z-index: 1000;
    background: var(--color-header-background);
    backdrop-filter: blur(8px);
    top: 0;
    left: 0;
    right: 0;
    transition: background var(--color-transition-duration);
  `,

  headerBorder: styled.css`
    height: 1px;
    position: fixed;
    top: 40px;
    left: 0;
    right: 0;
    background: var(--color-header-border-background);
    backdrop-filter: blur(8px);
    transition: background var(--color-transition-duration);
  `,

  headerContent: styled.css`
    justify-content: space-between;
    padding: 8px 24px;
    width: 750px;
    max-width: 100%;
    display: flex;
    margin: 0 auto;
  `,

  headerSection: styled.css`
    display: flex;
    align-items: center;
  `,

  homeLink: styled.css`
    color: var(--color-text);
    font-size: 16px;
    line-height: 24px;
    padding: 0 8px;
    margin-left: -8px;

    &:hover {
      text-decoration: none;
    }
  `,

  content: styled.css`
    width: 750px;
    max-width: 100%;
    margin: 0 auto;
    padding: 128px 24px 25vh;

    @media (max-width: 800px) {
      padding-top: 80px;
      width: auto;
    }
  `,
});
