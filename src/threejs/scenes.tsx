import dynamic from "next/dynamic";
import { useContext, useEffect, useRef } from "react";
import { useVisible } from "../utils/hooks/useVisible";
import { LoadThreeContext } from "./Components/ThreeProvider";

const loading = () => <p>Loading</p>;

interface SceneProps {
  visible: boolean;
  height: number;
  zoom?: number;
  yOffset?: number;
}

// prettier-ignore
export const threeJsScenes: Partial<Record<string, React.ComponentType<SceneProps>>> = {
  "what-is-a-plane": dynamic(() => import("./scenes/what-is-a-plane"), { loading }),
  "point-and-normal": dynamic(() => import("./scenes/point-and-normal"), { loading }),
  "point-and-normal-with-plane": dynamic(() => import("./scenes/point-and-normal-with-plane"), { loading }),
  "plane-intersecting-points": dynamic(() => import("./scenes/plane-intersecting-points"), { loading }),
  "three-points": dynamic(() => import("./scenes/three-points"), { loading }),
  "three-points-edge-vectors": dynamic(() => import("./scenes/three-points-edge-vectors"), { loading }),
  "three-points-cross-product": dynamic(() => import("./scenes/three-points-cross-product"), { loading }),
  "three-points-normal": dynamic(() => import("./scenes/three-points-normal"), { loading }),
  "three-points-normal-centered": dynamic(() => import("./scenes/three-points-normal-centered"), { loading }),
  "three-points-plane": dynamic(() => import("./scenes/three-points-plane"), { loading }),
  "plane-perpendicular": dynamic(() => import("./scenes/plane-perpendicular"), { loading }),
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
  "ray-and-line": dynamic(() => import("./scenes/ray-and-line"), { loading }),
  "ray-and-line-plane-intersection": dynamic(() => import("./scenes/ray-and-line-plane-intersection"), { loading }),
  "intersecting-planes": dynamic(() => import("./scenes/intersecting-planes"), { loading }),
  "intersecting-planes-points": dynamic(() => import("./scenes/intersecting-planes-points"), { loading }),
  "line": dynamic(() => import("./scenes/line"), { loading }),
  "intersecting-planes-point-and-normal": dynamic(() => import("./scenes/intersecting-planes-point-and-normal"), { loading }),
  "intersecting-planes-virtual-plane": dynamic(() => import("./scenes/intersecting-planes-virtual-plane"), { loading }),
  "intersecting-planes-offset": dynamic(() => import("./scenes/intersecting-planes-offset"), { loading }),
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
};

interface Props {
  scene: string;
  height: number;
  zoom?: number;
  yOffset?: number;
}

export const Scene: React.FC<Props> = (props) => {
  const { scene, height, zoom, yOffset } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useVisible(containerRef);

  if (typeof height !== "number") throw new Error("'height' is a required prop for <Scene>");
  const S = threeJsScenes[scene];
  if (!S) throw new Error(`No such scene '${scene}'`);

  const { load, loaded } = useContext(LoadThreeContext);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded]);

  const heightRef = useRef(height);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    heightRef.current = container.clientHeight;
  }, [loaded, visible]);

  return (
    <div ref={containerRef} className="scene">
      {loaded && visible ? (
        <S visible={visible} height={height} yOffset={yOffset} zoom={zoom} />
      ) : (
        <div style={{ minHeight: heightRef.current }} />
      )}
    </div>
  );
};
