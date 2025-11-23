import { useContext, useRef } from "react";
import { FiberContext } from "./ThreeProvider";

interface Props {
  onFrame: (buffer: Uint8Array) => void;
}

export function FrameReader(props: Props) {
  const FIBER = useContext(FiberContext);

  const bufferRef = useRef<Uint8Array | null>(null);

  FIBER.useFrame((state) => {
    const { gl } = state;

    const webglContext = gl.getContext();
    const canvas = webglContext.canvas!;
    const len = canvas.width * canvas.height * 4;
    if (!bufferRef.current || bufferRef.current.length !== len) {
      bufferRef.current = new Uint8Array(len);
    }

    webglContext.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      webglContext.RGBA,
      webglContext.UNSIGNED_BYTE,
      bufferRef.current,
    );

    props.onFrame(bufferRef.current);
  });

  return null;
}
