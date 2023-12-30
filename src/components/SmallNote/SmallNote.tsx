import { StyleOptions, useStyles } from "../../utils/styles";

const SmallNoteStyles = ({ styled, theme }: StyleOptions) => ({
  p: styled.css`
    font-size: 14px;
    color: ${theme.text400};

    &--center {
      text-align: center;
    }
  `,
});

interface Props {
  children: React.ReactNode;
  moveCloserUpBy?: number;
  label?: string;
  center?: boolean;
}

export const SmallNote = (props: Props) => {
  const s = useStyles(SmallNoteStyles);
  const { label = "Note", center } = props;
  return (
    <p className={s("p", { center })} style={{ marginTop: -(props.moveCloserUpBy ?? 0) }}>
      {label ? label + ": " : null}
      {props.children}
    </p>
  );
};
