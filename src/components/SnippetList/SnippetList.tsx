import { StyleOptions, useStyles } from "../../utils/styles";

const SnippetListStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;

    & > * {
      flex-basis: 0;
      flex-grow: 1;
      max-width: calc(50% - 12px);
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
