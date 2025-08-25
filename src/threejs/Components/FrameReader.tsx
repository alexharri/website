import { useContext } from "react";
import { FiberContext } from "./ThreeProvider";

interface Props {
  onFrame: (buffer: Uint8Array) => void;
}

export function FrameReader(props: Props) {
  const FIBER = useContext(FiberContext);

  FIBER.useFrame((state) => {
    const { gl } = state;

    const webglContext = gl.getContext();
    const canvas = webglContext.canvas!;
    const pixelBuffer = new Uint8Array(canvas.width * canvas.height * 4);

    webglContext.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      webglContext.RGBA,
      webglContext.UNSIGNED_BYTE,
      pixelBuffer,
    );

    props.onFrame(pixelBuffer);
  });

  return null;
}
