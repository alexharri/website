import { StyleOptions } from "../../utils/styles";

export const PostCardStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    display: flex;
    justify-content: stretch;
    align-items: stretch;
  `,

  link: styled.css`
    color: inherit;
    display: block;
    background: ${theme.background100};
    border: 1px solid ${theme.darkBlue400};
    border-radius: 4px;
    padding: 24px;

    time {
      display: block;
      font-size: 16px;
      margin-bottom: 8px;
      color: ${theme.text400};
    }

    h2 {
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 16px;
    }

    &:hover {
      text-decoration: none;

      h2 {
        text-decoration: underline;
      }
    }

    p {
      margin-bottom: 16px;
    }
  `,

  read: styled.css`
    font-size: 18px;
    line-height: 1.2;
    color: ${theme.blue};
    font-weight: 600;
    display: inline-block;

    &:hover {
      text-decoration: underline;
    }
  `,
});
