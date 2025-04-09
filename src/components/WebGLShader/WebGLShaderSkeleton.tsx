import { createContext, useContext, useMemo } from "react";
import { WebGLShaderProps } from "./WebGLShader";
import { CONTROLS_HEIGHT, DEFAULT_HEIGHT, SKEW_DEG } from "./constants";
import { css } from "@emotion/css";
import { SkeletonLoaderAnimation } from "../SkeletonLoaderAnimation/SkeletonLoaderAnimation";
import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions, useStyles } from "../../utils/styles";

function useCanvasHeightPlaceholderClassName(
  props: Pick<WebGLShaderProps, "height" | "maintainHeight" | "width" | "minWidth" | "skew">,
) {
  const { height = DEFAULT_HEIGHT, maintainHeight = 0 } = props;
  const width = props.minWidth ?? props.width;

  return useMemo(() => {
    const styled = { css };
    const classNames = [
      styled.css`
        position: relative;
        padding-top: ${height}px;
        width: 100vw;
      `,
    ];
    if (typeof width === "number") {
      const heightProportion = height / width;
      classNames.push(styled.css`
        @media (max-width: ${width}px) {
          padding-top: ${heightProportion * 100}vw !important;
          padding-bottom: calc(
            ${height * maintainHeight}px - ${heightProportion * maintainHeight * 100}vw
          );
        }
      `);
    }
    return classNames.join(" ");
  }, [width, height]);
}

export const WebGLShaderPropsContext = createContext<Omit<WebGLShaderProps, "colorConfiguration">>(
  null!,
);

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    overflow: hidden;
    margin: 0px auto;
    max-width: 100%;

    &--skew {
      transform: skewY(-${SKEW_DEG}deg);
    }
    &--hasWidth {
      width: ${cssVariables.contentWidth}px;
      border-radius: 4px;
    }
  `,

  loadingMessage: styled.css`
    color: ${theme.text400};
    margin: 0;
    position: relative;
    z-index: 3;
    padding: 0 32px;
    text-align: center;

    &--skew {
      transform: skewY(${SKEW_DEG}deg) skewX(-12deg);
    }
  `,
});

export const WebGLShaderSkeleton = () => {
  const props = useContext(WebGLShaderPropsContext);
  const s = useStyles(styles);
  const heightClassName = useCanvasHeightPlaceholderClassName(props);

  const { skew = false, showControls = true } = props;
  const hasWidth = typeof props.width === "number";

  return (
    <>
      <div
        className={[heightClassName, s("wrapper", { hasWidth, skew })].join(" ")}
        data-maintain={props.maintainHeight}
      >
        <SkeletonLoaderAnimation>
          <p className={s("loadingMessage", { skew })}>Loading canvas...</p>
        </SkeletonLoaderAnimation>
      </div>
      {showControls && props.usesVariables && (
        <div style={{ paddingBottom: `${CONTROLS_HEIGHT}px` }} />
      )}
    </>
  );
};
