import dynamic from "next/dynamic";

export const threeJsScenes: Partial<Record<string, React.ComponentType>> = {
  "default": dynamic(() => import("./scenes/Default"), { loading: () => <p>Loading</p> }),
}

interface SceneProps {
  scene: string;
}

export const Scene: React.FC<SceneProps> = (props) => {
  const { scene } = props;
  const S = threeJsScenes[scene];
  if (!S) throw new Error(`No such scene '${scene}'`);
  return <S />;
}