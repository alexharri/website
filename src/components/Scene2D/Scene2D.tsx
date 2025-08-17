import React from "react";
import { canvas2DScenes } from "./scenes";

interface Scene2DProps {
  scene: string;
  height?: number;
}

export const Scene2D: React.FC<Scene2DProps> = ({ scene, height }) => {
  const SceneComponent = canvas2DScenes[scene];
  if (!SceneComponent) {
    console.error(`No 2D scene found for: ${scene}`);
    return <div>Scene not found: {scene}</div>;
  }

  return <SceneComponent height={height} />;
};
