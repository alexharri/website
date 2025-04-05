import { useContext } from "react";
import { SCENE_BASELINE_WIDTH } from "./constants";
import { ScenePropsContext } from "./scenes";
import { SkeletonLoaderAnimation } from "../components/SkeletonLoaderAnimation/SkeletonLoaderAnimation";
import { cssVariables } from "../utils/cssVariables";
import { StyleOptions, useStyles } from "../utils/styles";

const styles = ({ styled }: StyleOptions) => ({
  scene: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: ${cssVariables.contentWidth}px;
    overflow: hidden;
    border-radius: 32px;
    margin: 0 auto;
    max-width: 100%;

    @media (max-width: 800px) {
      width: 100%;
      border-radius: 0;
    }
  `,

  loadingMessage: styled.css`
    position: relative;
    z-index: 3;
    padding: 0 32px;
    text-align: center;
  `,
});

export const SceneSkeleton: React.FC = () => {
  const {
    height: targetHeight,
    usesVariables,
    errorLoadingThreeJs,
  } = useContext(ScenePropsContext);
  const s = useStyles(styles);

  const variablesHeight = usesVariables ? 56 : 0;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ margin: "0 auto", width: SCENE_BASELINE_WIDTH, maxWidth: "100%" }}>
        <div style={{ paddingBottom: `${(targetHeight / SCENE_BASELINE_WIDTH) * 100}%` }} />
        <div style={{ height: variablesHeight }} />
      </div>
      <div className={s("scene")}>
        <SkeletonLoaderAnimation>
          <p className={s("loadingMessage")}>
            {errorLoadingThreeJs
              ? "Error loading three.js, please reload the page"
              : "Loading 3D scene"}
          </p>
        </SkeletonLoaderAnimation>
      </div>
    </div>
  );
};
