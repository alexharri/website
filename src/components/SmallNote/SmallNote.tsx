import styles from "./SmallNote.module.scss";

interface Props {
  children: React.ReactNode;
  moveCloserUpBy?: number;
  label?: string;
}

export const SmallNote = (props: Props) => {
  const { label = "Note" } = props;
  return (
    <p className={styles.p} style={{ marginTop: -(props.moveCloserUpBy ?? 0) }}>
      {label ? label + ": " : null}
      {props.children}
    </p>
  );
};
