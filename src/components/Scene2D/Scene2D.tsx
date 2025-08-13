import React, { useEffect, useRef } from "react";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { canvas2DScenes } from "./scenes";

interface Scene2DProps {
  scene: string;
  [key: string]: any; // Allow additional scene-specific props
}

export const Scene2D: React.FC<Scene2DProps> = ({ scene, ...sceneProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { canvasRef, onFrame, height } = useCanvasContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const SceneComponent = canvas2DScenes[scene];
    if (!SceneComponent) {
      console.error(`No 2D scene found for: ${scene}`);
      return;
    }

    // Wait for container to have dimensions
    const containerWidth = container.clientWidth || 800; // fallback width
    
    // Set canvas size
    canvas.width = containerWidth;
    canvas.height = height;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create scene instance
    const sceneInstance = new SceneComponent(ctx, canvas.width, canvas.height, sceneProps);

    // Animation loop
    const animate = () => {
      sceneInstance.render();
      
      // Get pixel data and send to ASCII renderer
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      onFrame(new Uint8Array(imageData.data.buffer));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene, height, canvasRef, onFrame, sceneProps]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: `${height}px` }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};