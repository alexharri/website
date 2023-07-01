import { StyleOptions } from "../../utils/styles";

export const BlogPostStyles = ({ styled }: StyleOptions) => ({
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
      margin-bottom: 16px;
    }
  `,

  read: styled.css`
    font-size: 18px;
    color: var(--color-blue);
    font-weight: 600;
    display: inline-block;

    &:hover {
      text-decoration: underline;
    }
  `,
});
