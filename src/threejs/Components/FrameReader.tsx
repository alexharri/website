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

    props.onFrame(
      { canvas },
      {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      },
    );
  });

  return null;
}
