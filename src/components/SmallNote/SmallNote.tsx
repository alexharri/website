import { StyleOptions, useStyles } from "../../utils/styles";

const SmallNoteStyles = ({ styled, theme }: StyleOptions) => ({
  p: styled.css`
    font-size: 14px;
    color: ${theme.text400};

    &--thanks {
      font-size: 18px;
      margin-top: 40px;
    }

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
  thanks?: boolean;
}

export const SmallNote = (props: Props) => {
  const s = useStyles(SmallNoteStyles);
  let { label = "Note", center, thanks } = props;
  if (thanks) label = "";
  return (
    <p className={["note", s("p", { center, thanks })].join(" ")}>
      {label ? label + ": " : null}
      {props.children}
    </p>
  );
};
