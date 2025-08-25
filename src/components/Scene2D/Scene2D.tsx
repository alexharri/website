import React from "react";
import { canvas2DScenes } from "./scenes";

interface Scene2DProps {
  scene: string;
  height?: number;
  width?: number;
}

export const Scene2D: React.FC<Scene2DProps> = ({ scene, height, width }) => {
  const SceneComponent = canvas2DScenes[scene];
  if (!SceneComponent) {
    console.error(`No 2D scene found for: ${scene}`);
    return <div>Scene not found: {scene}</div>;
  }

  return <SceneComponent height={height} width={width} />;
};
