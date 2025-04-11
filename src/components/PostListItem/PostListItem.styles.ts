import { StyleOptions } from "../../utils/styles";

export const PostListItemStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    width: 100%;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
  `,

  link: styled.css`
    color: inherit;
    display: block;
    width: 100%;
    background: ${theme.background100};
    border: 1px solid ${theme.darkBlue400};
    border-radius: 4px;
    padding: 16px;

    time {
      display: inline-block;
      font-size: inherit;
      color: inherit;
      white-space: nowrap;
    }

    h3 {
      font-size: 19px;
      margin: 0;
      margin-bottom: 4px;
      font-weight: 500;
    }

    &:hover {
      text-decoration: none;
      h3 {
        text-decoration: underline;
      }
    }

    p {
      margin: 0;
      color: ${theme.text400};
      font-size: 17px;

      @media (max-width: 600px) {
        font-size: 15px;
      }
    }
  `,

  dot: styled.css`
    margin: auto 6px;
    display: inline-block;
    color: ${theme.text200};
    transform: scale(1.4);
  `,
});
