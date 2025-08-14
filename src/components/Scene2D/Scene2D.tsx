import React, { useEffect, useRef } from "react";
import { useCanvasContext } from "../../contexts/CanvasContext";
import { canvas2DScenes } from "./scenes";

function flipBufferYAxis(buffer: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(buffer.length);
  const bytesPerPixel = 4;

  for (let y = 0; y < height; y++) {
    const sourceRow = (height - 1 - y) * width * bytesPerPixel;
    const targetRow = y * width * bytesPerPixel;
    for (let x = 0; x < width * bytesPerPixel; x++) {
      out[targetRow + x] = buffer[sourceRow + x];
    }
  }

  return out;
}

interface Scene2DProps {
  scene: string;
  [key: string]: any; // Allow additional scene-specific props
}

export const Scene2D: React.FC<Scene2DProps> = ({ scene, ...sceneProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
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

    let mounted = true;

    // Create scene instance
    const sceneInstance = new SceneComponent(ctx);

    const tick = () => {
      if (!mounted) return;
      requestAnimationFrame(tick);

      sceneInstance.render();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let buffer = new Uint8Array(imageData.data.buffer);
      buffer = flipBufferYAxis(buffer, canvas.width, canvas.height);
      onFrame(buffer);
    };
    tick();

    return () => {
      mounted = false;
    };
  }, [scene, height, canvasRef, onFrame, sceneProps]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: `${height}px` }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};
