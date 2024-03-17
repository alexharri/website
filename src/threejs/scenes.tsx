import dynamic from "next/dynamic";
import { useRef } from "react";
import { useVisible } from "../utils/hooks/useVisible";

const loading = () => <p>Loading</p>;

// prettier-ignore
export const threeJsScenes: Partial<Record<string, React.ComponentType>> = {
  "what-is-a-plane": dynamic(() => import("./scenes/what-is-a-plane"), { loading }),
  "point-and-normal": dynamic(() => import("./scenes/point-and-normal"), { loading }),
  "point-and-normal-with-plane": dynamic(() => import("./scenes/point-and-normal-with-plane"), { loading }),
  "three-points": dynamic(() => import("./scenes/three-points"), { loading }),
  "three-points-normal": dynamic(() => import("./scenes/three-points-normal"), { loading }),
  "three-points-plane": dynamic(() => import("./scenes/three-points-plane"), { loading }),
};

interface SceneProps {
  scene: string;
  height: number;
}

export const Scene: React.FC<SceneProps> = (props) => {
  const { scene, height } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useVisible(containerRef);

  if (typeof height !== "number") throw new Error("'height' is a required prop for <Scene>");
  const S = threeJsScenes[scene];
  if (!S) throw new Error(`No such scene '${scene}'`);

  return (
    <div ref={containerRef} style={{ height }}>
      {visible && <S />}
    </div>
  );
};
