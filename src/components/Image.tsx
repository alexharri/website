import { NextRouter, useRouter } from "next/router";
import { useStyles } from "../utils/styles";
import { ImageStyles } from "./Image.styles";
import { cssVariables } from "../utils/cssVariables";

interface Props {
  src?: string;
  noMargin?: boolean;
  plain?: boolean;
  width?: number | "auto";
  scrollable?: boolean;
}

const videoExtensions = new Set(["mp4"]);
const customPosts = new Set([
  "stabilizing-noisy-inputs",
  "icelandic-name-declension-trie",
  "canvas-to-ascii",
]);

export function imgSrcToHref(src: string, router: NextRouter) {
  const { slug } = router.query;
  const isBlogPost = ["/blog/draft/", "/blog/"].some((path) => router.pathname.startsWith(path));
  if (src.startsWith("~/") && isBlogPost) {
    const parts = router.pathname.split("/");
    const lastPart = parts[parts.length - 1];

    if (typeof slug === "string") {
      const dirName = `/images/posts/${slug}/`;
      return dirName + src.substr(2);
    } else if (customPosts.has(lastPart)) {
      const dirName = `/images/posts/${lastPart}/`;
      return dirName + src.substr(2);
    }
  }
  return src;
}

export const Image = (props: Props) => {
  const s = useStyles(ImageStyles);
  const router = useRouter();

  const { noMargin, plain, scrollable = false } = props;
  let src = props.src || "";

  const srcParts = src.split(".");
  const extension = srcParts[srcParts.length - 1];
  const video = videoExtensions.has(extension);

  src = imgSrcToHref(src || "", router);

  let flow = true;
  let width: string | number | undefined;

  if (typeof props.width === "number") {
    width = props.width;
    flow = false;
  } else if (props.width === "auto") {
    flow = false;
  }

  let containerClassName = ["image", s("container", { plain, noMargin, scrollable })].join(" ");
  if (flow) containerClassName += " flow";

  const className = s("image", { plain });
  const commonProps = { src, width, className };

  function onClickVideo(e: React.MouseEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    if (video.paused) video.play();
    else video.pause();
  }

  if (scrollable && typeof width !== "number") {
    throw new Error(`Width must be specified for scrollable images`);
  }

  return (
    <div className={containerClassName} style={{ width: scrollable ? undefined : width }}>
      <div
        className={s("wrapper", { scrollable })}
        style={{
          minWidth: scrollable ? (width as number) + cssVariables.contentPadding * 2 : undefined,
        }}
      >
        {video ? (
          <video
            {...commonProps}
            autoPlay
            muted
            playsInline
            preload=""
            tabIndex={-1}
            loop
            onClick={onClickVideo}
          />
        ) : (
          <img {...commonProps} />
        )}
      </div>
    </div>
  );
};
