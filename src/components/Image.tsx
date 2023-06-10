import { useRouter } from "next/router";
import styles from "./Image.module.scss";

interface Props {
  src?: string;
  wide?: boolean;
}

export const Image = (props: Props) => {
  const router = useRouter();

  const { wide } = props;
  let src = props.src || "";

  const { slug } = router.query;

  if (src.startsWith("~/")) {
    const isBlogPost = ["/blog/draft/[slug]" || "/blog/[slug]"].includes(router.pathname);
    if (typeof slug === "string" && isBlogPost) {
      const dirName = `/images/posts/${slug}/`;
      src = dirName + src.substr(2);
    }
  }

  return (
    <div className={styles.container} data-wide={wide}>
      <img {...props} src={src} width="100%" className={styles.image} />
    </div>
  );
};
