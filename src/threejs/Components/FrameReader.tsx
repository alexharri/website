import { useContext } from "react";
import { FiberContext } from "./ThreeProvider";
import { OnFrameOptions, OnFrameSource } from "../../contexts/CanvasContext";

interface Props {
  onFrame: (source: OnFrameSource, options: OnFrameOptions) => void;
}

export function FrameReader(props: Props) {
  const FIBER = useContext(FiberContext);

  FIBER.useFrame((state) => {
    const { gl } = state;
    const canvas = gl.domElement;

    // Pass the canvas directly - no GPU→CPU transfer needed!
    // GPUSamplingDataGenerator will use it as a texture source
    props.onFrame(
      { canvas },
      {
        flipY: true,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      },
    );
  });

  return null;
}
