import styles from "./SmallNote.module.scss";

interface Props {
  children: React.ReactNode;
}

export const SmallNote = (props: Props) => {
  return <p className={styles.p}>Note: {props.children}</p>;
};
