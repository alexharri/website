import { StyleOptions, useStyles } from "../../utils/styles";

const SnippetListStyles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (max-width: 670px) {
      grid-template-columns: repeat(1, 1fr);
    }

    & > article {
      h2 {
        margin-top: 0;
      }

      background: ${theme.background100};
      border: 1px solid ${theme.darkBlue400};
      border-radius: 4px;
      padding: 24px;
    }
  `,
});

interface Props {
  children: React.ReactNode;
}

export const SnippetList = (props: Props) => {
  const s = useStyles(SnippetListStyles);
  return <div className={s("container")}>{props.children}</div>;
};
