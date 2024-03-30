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
  "three-points": dynamic(() => import("./scenes/three-points"), { loading }),
  "three-points-edge-vectors": dynamic(() => import("./scenes/three-points-edge-vectors"), { loading }),
  "three-points-cross-product": dynamic(() => import("./scenes/three-points-cross-product"), { loading }),
  "three-points-normal": dynamic(() => import("./scenes/three-points-normal"), { loading }),
  "three-points-plane": dynamic(() => import("./scenes/three-points-plane"), { loading }),
  "plane-perpendicular": dynamic(() => import("./scenes/plane-perpendicular"), { loading }),
  "constant-normal-form": dynamic(() => import("./scenes/constant-normal-form"), { loading }),
  "point-normal-and-constant-normal-form": dynamic(() => import("./scenes/point-normal-and-constant-normal-form"), { loading }),
  "point-and-plane": dynamic(() => import("./scenes/point-and-plane"), { loading }),
  "point-distance-step-1": dynamic(() => import("./scenes/point-distance-step-1"), { loading }),
  "point-distance-step-2": dynamic(() => import("./scenes/point-distance-step-2"), { loading }),
  "point-distance-step-3": dynamic(() => import("./scenes/point-distance-step-3"), { loading }),
  "parallel-planes": dynamic(() => import("./scenes/parallel-planes"), { loading }),
  "intersecting-planes": dynamic(() => import("./scenes/intersecting-planes"), { loading }),
  "intersecting-planes-point-and-normal": dynamic(() => import("./scenes/intersecting-planes-point-and-normal"), { loading }),
  "intersecting-planes-virtual-plane": dynamic(() => import("./scenes/intersecting-planes-virtual-plane"), { loading }),
  "intersecting-planes-offset": dynamic(() => import("./scenes/intersecting-planes-offset"), { loading }),
  "three-plane-intersection-configurations": dynamic(() => import("./scenes/three-plane-intersection-configurations"), { loading }),
  "three-planes-n2-n3-parallel": dynamic(() => import("./scenes/three-planes-n2-n3-parallel"), { loading }),
  "three-planes-n1-n2-parallel": dynamic(() => import("./scenes/three-planes-n1-n2-parallel"), { loading }),
  "three-planes-n1-n2-parallel-cross": dynamic(() => import("./scenes/three-planes-n1-n2-parallel-cross"), { loading }),
  "three-planes-three-lines": dynamic(() => import("./scenes/three-planes-three-lines"), { loading }),
  "three-planes-three-lines-cross": dynamic(() => import("./scenes/three-planes-three-lines-cross"), { loading }),
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
    if (loaded) {
      console.log("Loaded ThreeJS!");
    }
  }, [loaded]);

  return (
    <div ref={containerRef} style={loaded ? {} : { height }} className="scene">
      {loaded && <S visible={visible} height={height} yOffset={yOffset} zoom={zoom} />}
    </div>
  );
};
