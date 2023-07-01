import { StyleOptions } from "../../utils/styles";

export const SnippetStyles = ({ styled }: StyleOptions) => ({
  title: styled.css`
    font-size: 18px;
  `,

  link: styled.css`
    color: inherit;
    display: block;

    &:hover {
      text-decoration: none;

      h2 {
        text-decoration: underline;
      }
    }

    p {
      font-size: 16px;
      margin-bottom: 8px;
    }
  `,
});
