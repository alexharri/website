import { StyleOptions, useStyles } from "../utils/styles";
import { Image, imgSrcToHref } from "./Image";
import { useViewportWidth } from "../utils/hooks/useViewportWidth";
import { useCallback, useMemo, useState } from "react";
import { cssVariables } from "../utils/cssVariables";
import { useRouter } from "next/router";
import { useMounted } from "../utils/hooks/useMounted";
import { clamp } from "../math/math";
import { ArrowIcon16 } from "./Icon/ArrowIcon16";

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    max-width: 100%;
    margin: 40px auto 0;
    position: relative;

    &:after {
      content: "";
      position: absolute;
      right: 100%;
      top: -40px;
      bottom: -40px;
      width: 400%;
      background: linear-gradient(270deg, transparent 0%, ${theme.background} 10%);
      z-index: 200;
    }
  `,

  children: styled.css`
    .note {
      margin-bottom: 0;
    }
  `,

  imageContainer: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: 100% 50%;
    perspective: 800px;

    &,
    img {
      transition: all cubic-bezier(0.3, 0.11, 0.1, 1) 0.45s;
    }
  `,

  image: styled.css`
    background: ${theme.background};
    display: flex;
    justify-content: center;
    align-items: center;
    transform-origin: 100% 50%;
    transition: all cubic-bezier(0.6, 0.05, 0.5, 0.97) 0.45s;
  `,

  controls: styled.css`
    display: flex;
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 40px;
    gap: 16px;

    span {
      font-size: 17px;
      letter-spacing: 1px;
    }

    button {
      width: 32px;
      height: 32px;
    }

    button svg {
      color: ${theme.text700};

      transition: color 0.15s;

      &:hover {
        color: ${theme.text};
      }
    }

    button:disabled {
      cursor: default;
    }

    button:disabled svg {
      color: ${theme.text200};
    }
  `,
});

interface Image {
  src: string;
  dimensions: [number, number];
}

const DEFAULT_HEIGHT = 400;
const DEFAULT_WIDTH = cssVariables.contentWidth - cssVariables.contentPadding * 2;

interface Props {
  images: Image[];
  height?: number;
  width?: number;
  children?: React.ReactNode;
}

export const ImageCarousel = (props: Props) => {
  let { images } = props;

  const s = useStyles(styles);
  const router = useRouter();
  const viewportWidth = useViewportWidth();
  const mounted = useMounted();
  const [index, setIndex] = useState(0);

  const [targetWidth, targetHeight] = useMemo(() => {
    // For now, just use the ratio of the first image.
    const ratio = images[0].dimensions[0] / images[0].dimensions[1];
    //
    // let maxRatio = -Infinity;
    // let minRatio = Infinity;
    // for (const image of images) {
    //   const ratio = image.dimensions[0] / image.dimensions[1];
    //   if (ratio > maxRatio) maxRatio = ratio;
    //   if (ratio < minRatio) minRatio = ratio;
    // }

    let targetHeight = props.height ?? DEFAULT_HEIGHT;
    let targetWidth = props.width ?? DEFAULT_WIDTH;
    if (props.height != null && props.width == null) targetWidth = targetHeight * ratio;
    else if (props.height == null) targetHeight = targetWidth / ratio;
    return [targetWidth, targetHeight];
  }, [props.width, props.height, images]);

  const imageDimensions = useMemo(
    () =>
      images.map((image) => {
        const availableWidth = viewportWidth! - cssVariables.contentPadding * 2;
        const ratio = image.dimensions[0] / image.dimensions[1];
        const widthToUse = Math.min(availableWidth, targetWidth);
        const downScale = widthToUse / targetWidth;
        const carouselHeight = targetHeight * downScale;
        const expectedWidth = carouselHeight * ratio;
        const scalar = Math.min(1, Math.min(availableWidth, targetWidth) / expectedWidth);
        return { width: carouselHeight * scalar * ratio, height: carouselHeight * scalar };
      }),
    [images, viewportWidth, targetWidth, targetHeight],
  );

  const getImageOffsetStyles = useCallback(
    (offset: number, width: number, height: number) => {
      const opacity =
        offset > 0
          ? clamp(1 - Math.pow(offset, 0.5) * 0.5, 0, 1)
          : clamp(1 - Math.pow(-offset, 0.2) * 0.7, 0, 1);
      let translate = "translate(-50%, -50%)";
      let transform = "";
      if (offset < 0) {
        translate += ` translateX(calc(-100% + ${-48 + offset * 48}px))`;
        transform = `rotate3d(0, 1, 0, ${offset * 10}deg) scale(${
          (height + Math.min(80, Math.pow(-offset, 0.6) * 40)) / height
        })`;
      } else if (offset > 0) {
        translate += ` translateX(${(targetWidth - width) / 2}px) scale(${
          1 - 0.1 * offset
        }) translateX(${Math.pow(offset, 0.8) * 14}px)`;
      }
      return { opacity, transform, translate };
    },
    [targetWidth],
  );

  return (
    <>
      <div className={s("container")} style={{ width: targetWidth }}>
        <div style={{ paddingBottom: `${(targetHeight / targetWidth) * 100}%` }} />
        {mounted &&
          viewportWidth != null &&
          images.map((image, i) => {
            const { width, height } = imageDimensions[i];
            const offset = i - index;
            const { opacity, transform, translate } = getImageOffsetStyles(offset, width, height);

            return (
              <div
                style={{ width, height, transform: translate, zIndex: 100 - i }}
                className={s("imageContainer")}
                key={i}
              >
                <div style={{ width, height, transform }} className={s("image")}>
                  <img src={imgSrcToHref(image.src, router)} style={{ width, height, opacity }} />
                </div>
              </div>
            );
          })}
      </div>
      {props.children && <div className={s("children")}>{props.children}</div>}
      <div className={s("controls")}>
        <button
          disabled={index === 0}
          onClick={() => setIndex((index) => clamp(index - 1, 0, images.length - 1))}
        >
          <ArrowIcon16 variant="beak" direction="left" />
        </button>
        <span>
          {index + 1}/{images.length}
        </span>
        <button
          disabled={index === images.length - 1}
          onClick={() => setIndex((index) => clamp(index + 1, 0, images.length - 1))}
        >
          <ArrowIcon16 variant="beak" direction="right" />
        </button>
      </div>
    </>
  );
};
