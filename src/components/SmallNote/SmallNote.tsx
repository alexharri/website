import styles from "./SmallNote.module.scss";

interface Props {
  children: React.ReactNode;
  moveCloserUpBy?: number;
}

export const SmallNote = (props: Props) => {
  return (
    <p className={styles.p} style={{ marginTop: -(props.moveCloserUpBy ?? 0) }}>
      Note: {props.children}
    </p>
  );
};
