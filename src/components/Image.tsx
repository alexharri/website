import { useRouter } from "next/router";
import { useStyles } from "../utils/styles";
import { ImageStyles } from "./Image.styles";

interface Props {
  src?: string;
  maxWidth?: number;
  noMargin?: boolean;
  plain?: boolean;
  width?: number | "auto";
}

const customPosts = new Set(["stabilizing-noisy-inputs"]);

export const Image = ({ maxWidth, noMargin, plain, width, ...props }: Props) => {
  const s = useStyles(ImageStyles);
  const router = useRouter();

  let src = props.src || "";

  const { slug } = router.query;

  const isBlogPost = ["/blog/draft/", "/blog/"].some((path) => router.pathname.startsWith(path));
  if (src.startsWith("~/") && isBlogPost) {
    const parts = router.pathname.split("/");
    const lastPart = parts[parts.length - 1];

    if (typeof slug === "string") {
      const dirName = `/images/posts/${slug}/`;
      src = dirName + src.substr(2);
    } else if (customPosts.has(lastPart)) {
      const dirName = `/images/posts/${lastPart}/`;
      src = dirName + src.substr(2);
    }
  }

  let flow = true;
  let widthProp: string | number | undefined;

  // if (fullWidth) width = "auto";

  if (typeof width === "number") {
    widthProp = width;
    flow = false;
  } else if (width === "auto") {
    flow = false;
  }

  let containerClassName = ["image", s("container", { plain, noMargin })].join(" ");
  if (flow) containerClassName += " flow";

  return (
    <div className={containerClassName}>
      <img {...props} src={src} width={widthProp} className={s("image", { plain })} />
    </div>
  );
};
