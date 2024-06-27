import { useRouter } from "next/router";
import { useStyles } from "../utils/styles";
import { ImageStyles } from "./Image.styles";

interface Props {
  src?: string;
  noMargin?: boolean;
  plain?: boolean;
  width?: number | "auto";
}

const videoExtensions = new Set(["mp4"]);
const customPosts = new Set(["stabilizing-noisy-inputs"]);

export const Image = (props: Props) => {
  const s = useStyles(ImageStyles);
  const router = useRouter();

  const { noMargin, plain } = props;
  let src = props.src || "";

  const { slug } = router.query;

  const srcParts = src.split(".");
  const extension = srcParts[srcParts.length - 1];
  const video = videoExtensions.has(extension);

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
  let width: string | number | undefined;

  if (typeof props.width === "number") {
    width = props.width;
    flow = false;
  } else if (props.width === "auto") {
    flow = false;
  }

  let containerClassName = ["image", s("container", { plain, noMargin })].join(" ");
  if (flow) containerClassName += " flow";

  const className = s("image", { plain });
  const commonProps = { src, width, className };

  return (
    <div className={containerClassName}>
      {video ? (
        <video {...commonProps} autoPlay muted preload="" tabIndex={-1} loop />
      ) : (
        <img {...commonProps} />
      )}
    </div>
  );
};
