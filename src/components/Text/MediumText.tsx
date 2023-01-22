import styles from "./MediumText.module.scss";

interface Props {
  children: React.ReactNode;
}

export const MediumText = (props: Props) => {
  return <span className={styles.mediumText}>{props.children}</span>;
};
