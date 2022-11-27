import styles from "./SnippetList.module.scss";

interface Props {
  children: React.ReactNode;
}

export const SnippetList = (props: Props) => {
  return <div className={styles.container}>{props.children}</div>;
};
