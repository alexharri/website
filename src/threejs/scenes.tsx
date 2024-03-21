import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useMounted } from "../utils/hooks/useMounted";
import { useVisible } from "../utils/hooks/useVisible";

const loading = () => <p>Loading</p>;

interface SceneProps {
  visible: boolean;
  onLoad: () => void;
  height: number;
  yOffset?: number;
}

// prettier-ignore
export const threeJsScenes: Partial<Record<string, React.ComponentType<SceneProps>>> = {
  "what-is-a-plane": dynamic(() => import("./scenes/what-is-a-plane"), { loading }),
  "point-and-normal": dynamic(() => import("./scenes/point-and-normal"), { loading }),
  "point-and-normal-with-plane": dynamic(() => import("./scenes/point-and-normal-with-plane"), { loading }),
  "three-points": dynamic(() => import("./scenes/three-points"), { loading }),
  "three-points-normal": dynamic(() => import("./scenes/three-points-normal"), { loading }),
  "three-points-plane": dynamic(() => import("./scenes/three-points-plane"), { loading }),
  "plane-perpendicular": dynamic(() => import("./scenes/plane-perpendicular"), { loading }),
  "constant-normal-form": dynamic(() => import("./scenes/constant-normal-form"), { loading }),
};

interface Props {
  scene: string;
  height: number;
  yOffset?: number;
}

export const Scene: React.FC<Props> = (props) => {
  const { scene, height, yOffset } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useVisible(containerRef);
  const mounted = useMounted();

  const [loaded, setLoaded] = useState(false);

  if (typeof height !== "number") throw new Error("'height' is a required prop for <Scene>");
  const S = threeJsScenes[scene];
  if (!S) throw new Error(`No such scene '${scene}'`);

  return (
    <div ref={containerRef} style={loaded ? {} : { height }} className="scene">
      {mounted && (
        <S visible={visible} onLoad={() => setLoaded(true)} height={height} yOffset={yOffset} />
      )}
    </div>
  );
};
