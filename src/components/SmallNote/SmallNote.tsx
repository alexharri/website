import { StyleOptions, useStyles } from "../../utils/styles";

const SmallNoteStyles = ({ styled, theme }: StyleOptions) => ({
  p: styled.css`
    font-size: 14px;
    color: ${theme.text600};
  `,
});

interface Props {
  children: React.ReactNode;
  moveCloserUpBy?: number;
  label?: string;
}

export const SmallNote = (props: Props) => {
  const s = useStyles(SmallNoteStyles);
  const { label = "Note" } = props;
  return (
    <p className={s("p")} style={{ marginTop: -(props.moveCloserUpBy ?? 0) }}>
      {label ? label + ": " : null}
      {props.children}
    </p>
  );
};
