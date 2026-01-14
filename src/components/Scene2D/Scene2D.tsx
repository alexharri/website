import React from "react";
import { canvas2DScenes } from "./scenes";

interface Scene2DProps {
  scene: string;
  height?: number;
  width?: number;
}

// TODO: support lazy loading scenes
export const Scene2D: React.FC<Scene2DProps> = ({ scene, height, width }) => {
  const SceneComponent = canvas2DScenes[scene];
  if (!SceneComponent) {
    throw new Error(`No such 2D scene: ${scene}`);
  }

  return <SceneComponent height={height} width={width} />;
};
