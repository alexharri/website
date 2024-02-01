import { StyleOptions, useStyles } from "../../utils/styles";

const SmallNoteStyles = ({ styled, theme }: StyleOptions) => ({
  p: styled.css`
    font-size: 14px;
    color: ${theme.text400};

    &--center {
      text-align: center;
    }

    a {
      color: inherit;
      text-decoration: underline;
    }
  `,
});

interface Props {
  children: React.ReactNode;
  label?: string;
  center?: boolean;
}

export const SmallNote = (props: Props) => {
  const s = useStyles(SmallNoteStyles);
  const { label = "Note", center } = props;
  return (
    <p className={["note", s("p", { center })].join(" ")}>
      {label ? label + ": " : null}
      {props.children}
    </p>
  );
};
