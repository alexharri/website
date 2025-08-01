import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef } from "react";
import { useVisible } from "../utils/hooks/useVisible";
import { LoadThreeContext } from "./Components/ThreeProvider";
import { SceneSkeleton } from "./SceneSkeleton";

const loading = SceneSkeleton;

export interface SceneProps {
  scene: string;
  visible: boolean;
  height: number;
  autoRotate?: boolean;
  angle?: number;
  xRotation?: number;
  usesVariables?: boolean;
  zoom?: number;
  ascii?: boolean;
  yOffset?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  errorLoadingThreeJs: boolean;
}

export const ScenePropsContext = createContext<SceneProps>(null!);

// prettier-ignore
export const threeJsScenes: Partial<Record<string, React.ComponentType<SceneProps>>> = {
  "what-is-a-plane": dynamic(() => import("./scenes/what-is-a-plane"), { loading }),
  "point-and-normal": dynamic(() => import("./scenes/point-and-normal"), { loading }),
  "point-and-normal-with-plane": dynamic(() => import("./scenes/point-and-normal-with-plane"), { loading }),
  "plane-intersecting-points": dynamic(() => import("./scenes/plane-intersecting-points"), { loading }),
  "three-points": dynamic(() => import("./scenes/three-points"), { loading }),
  "three-points-edge-vectors": dynamic(() => import("./scenes/three-points-edge-vectors"), { loading }),
  "three-points-cross-product": dynamic(() => import("./scenes/three-points-cross-product"), { loading }),
  "cross-product": dynamic(() => import("./scenes/cross-product"), { loading }),
  "three-points-normal": dynamic(() => import("./scenes/three-points-normal"), { loading }),
  "three-points-normal-centered": dynamic(() => import("./scenes/three-points-normal-centered"), { loading }),
  "three-points-plane": dynamic(() => import("./scenes/three-points-plane"), { loading }),
  "constant-normal-form": dynamic(() => import("./scenes/constant-normal-form"), { loading }),
  "point-normal-and-constant-normal-form": dynamic(() => import("./scenes/point-normal-and-constant-normal-form"), { loading }),
  "point-and-plane": dynamic(() => import("./scenes/point-and-plane"), { loading }),
  "point-distance-step-1": dynamic(() => import("./scenes/point-distance-step-1"), { loading }),
  "point-distance-step-2": dynamic(() => import("./scenes/point-distance-step-2"), { loading }),
  "point-distance-step-3": dynamic(() => import("./scenes/point-distance-step-3"), { loading }),
  "project-point-onto-plane-along-normal": dynamic(() => import("./scenes/project-point-onto-plane-along-normal"), { loading }),
  "parallel-planes": dynamic(() => import("./scenes/parallel-planes"), { loading }),
  "project-point-onto-plane": dynamic(() => import("./scenes/project-point-onto-plane"), { loading }),
  "project-point-onto-plane-2": dynamic(() => import("./scenes/project-point-onto-plane-2"), { loading }),
  "project-point-onto-plane-3": dynamic(() => import("./scenes/project-point-onto-plane-3"), { loading }),
  "project-point-onto-plane-4": dynamic(() => import("./scenes/project-point-onto-plane-4"), { loading }),
  "ray-and-line": dynamic(() => import("./scenes/ray-and-line"), { loading }),
  "ray-and-line-plane-intersection": dynamic(() => import("./scenes/ray-and-line-plane-intersection"), { loading }),
  "intersecting-planes": dynamic(() => import("./scenes/intersecting-planes"), { loading }),
  "intersecting-planes-points": dynamic(() => import("./scenes/intersecting-planes-points"), { loading }),
  "line": dynamic(() => import("./scenes/line"), { loading }),
  "intersecting-planes-point-and-normal": dynamic(() => import("./scenes/intersecting-planes-point-and-normal"), { loading }),
  "intersecting-planes-virtual-plane": dynamic(() => import("./scenes/intersecting-planes-virtual-plane"), { loading }),
  "intersecting-planes-offset": dynamic(() => import("./scenes/intersecting-planes-offset"), { loading }),
  "intersecting-planes-offset-2": dynamic(() => import("./scenes/intersecting-planes-offset-2"), { loading }),
  "intersecting-planes-offset-3": dynamic(() => import("./scenes/intersecting-planes-offset-3"), { loading }),
  "intersecting-planes-offset-4": dynamic(() => import("./scenes/intersecting-planes-offset-4"), { loading }),
  "intersecting-planes-offset-5": dynamic(() => import("./scenes/intersecting-planes-offset-5"), { loading }),
  "intersecting-planes-offset-6": dynamic(() => import("./scenes/intersecting-planes-offset-6"), { loading }),
  "intersecting-planes-offset-7": dynamic(() => import("./scenes/intersecting-planes-offset-7"), { loading }),
  "three-plane-intersection-configurations": dynamic(() => import("./scenes/three-plane-intersection-configurations"), { loading }),
  "three-planes-n2-n3-parallel": dynamic(() => import("./scenes/three-planes-n2-n3-parallel"), { loading }),
  "three-planes-n1-n2-parallel": dynamic(() => import("./scenes/three-planes-n1-n2-parallel"), { loading }),
  "three-planes-n1-n2-parallel-cross": dynamic(() => import("./scenes/three-planes-n1-n2-parallel-cross"), { loading }),
  "three-planes-three-lines": dynamic(() => import("./scenes/three-planes-three-lines"), { loading }),
  "three-planes-three-lines-cross": dynamic(() => import("./scenes/three-planes-three-lines-cross"), { loading }),
  "three-planes-some-parallel": dynamic(() => import("./scenes/three-planes-some-parallel"), { loading }),
  "three-intersecting-planes-point": dynamic(() => import("./scenes/three-intersecting-planes-point"), { loading }),
  "three-intersecting-planes": dynamic(() => import("./scenes/three-intersecting-planes"), { loading }),
  "three-intersecting-planes-2": dynamic(() => import("./scenes/three-intersecting-planes-2"), { loading }),
  "three-intersecting-planes-3": dynamic(() => import("./scenes/three-intersecting-planes-3"), { loading }),
  "three-intersecting-planes-4": dynamic(() => import("./scenes/three-intersecting-planes-4"), { loading }),
  "three-intersecting-planes-5": dynamic(() => import("./scenes/three-intersecting-planes-5"), { loading }),
  "three-intersecting-planes-6": dynamic(() => import("./scenes/three-intersecting-planes-6"), { loading }),
  "three-intersecting-planes-7": dynamic(() => import("./scenes/three-intersecting-planes-7"), { loading }),
  "three-intersecting-planes-8": dynamic(() => import("./scenes/three-intersecting-planes-8"), { loading }),
  "three-intersecting-planes-9": dynamic(() => import("./scenes/three-intersecting-planes-9"), { loading }),
  "three-intersecting-planes-10": dynamic(() => import("./scenes/three-intersecting-planes-10"), { loading }),
  "three-intersecting-planes-11": dynamic(() => import("./scenes/three-intersecting-planes-11"), { loading }),
  
  "simplex": dynamic(() => import("./scenes/simplex"), { loading }),
  "simplex-point-array": dynamic(() => import("./scenes/simplex-point-array"), { loading }),

  "vr-controller": dynamic(() => import("./scenes/vr-controller"), { loading }),

  "cube": dynamic(() => import("./scenes/cube"), { loading })
};

interface Props {
  scene: string;
  height: number;
  angle?: number;
  autoRotate?: boolean;
  usesVariables?: boolean;
  zoom?: number;
  yOffset?: number;
  xRotation?: number;
  ascii?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export const Scene: React.FC<Props> = (props) => {
  const { scene, height, usesVariables, angle, zoom, yOffset, autoRotate, xRotation, ascii, canvasRef } =
    props;
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useVisible(containerRef, "350px");
  const render = useVisible(containerRef, "50px");

  if (typeof height !== "number") throw new Error("'height' is a required prop for <Scene>");
  const S = threeJsScenes[scene];
  if (!S) throw new Error(`No such scene '${scene}'`);

  const { load, loaded, error } = useContext(LoadThreeContext);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded]);

  const heightRef = useRef(height);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    heightRef.current = container.clientHeight;
  }, [loaded, visible]);

  const sceneProps: SceneProps = {
    scene,
    visible: render,
    autoRotate,
    angle,
    height,
    usesVariables,
    yOffset,
    zoom,
    xRotation,
    ascii,
    canvasRef,
    errorLoadingThreeJs: error,
  };

  return (
    <ScenePropsContext.Provider value={sceneProps}>
      <div ref={containerRef} className="scene">
        {loaded && visible ? <S {...sceneProps} /> : <SceneSkeleton />}
      </div>
    </ScenePropsContext.Provider>
  );
};
