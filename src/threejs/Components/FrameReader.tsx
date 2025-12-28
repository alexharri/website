import { useContext, useRef } from "react";
import { FiberContext } from "./ThreeProvider";
import { OnFrameOptions } from "../../contexts/CanvasContext";

interface Props {
  onFrame: (buffer: Uint8Array, options: OnFrameOptions) => void;
}

export function FrameReader(props: Props) {
  const FIBER = useContext(FiberContext);

  const bufferRef = useRef<Uint8Array | null>(null);
  const pboRef = useRef<{
    pbos: WebGLBuffer[];
    index: number;
    bufferSize: number;
    initialized: boolean;
  } | null>(null);

  FIBER.useFrame((state) => {
    const { gl } = state;

    const webglContext = gl.getContext() as WebGL2RenderingContext;
    const canvas = webglContext.canvas!;
    const len = canvas.width * canvas.height * 4;

    // Initialize buffers if needed
    if (!bufferRef.current || bufferRef.current.length !== len) {
      bufferRef.current = new Uint8Array(len);
    }

    // Initialize PBOs (double buffering)
    if (!pboRef.current || pboRef.current.bufferSize !== len) {
      // Clean up old PBOs if they exist
      if (pboRef.current) {
        pboRef.current.pbos.forEach((pbo) => webglContext.deleteBuffer(pbo));
      }

      // Create 2 PBOs for double buffering
      const pbos = [webglContext.createBuffer()!, webglContext.createBuffer()!];

      // Allocate storage for both PBOs
      pbos.forEach((pbo) => {
        webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbo);
        webglContext.bufferData(webglContext.PIXEL_PACK_BUFFER, len, webglContext.STREAM_READ);
      });

      webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, null);

      pboRef.current = { pbos, index: 0, bufferSize: len, initialized: false };
    }

    const { pbos, index } = pboRef.current;

    // First frame: do synchronous readback
    if (!pboRef.current.initialized) {
      webglContext.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        webglContext.RGBA,
        webglContext.UNSIGNED_BYTE,
        bufferRef.current,
      );

      props.onFrame(bufferRef.current, { canvasWidth: canvas.width, canvasHeight: canvas.height });

      // Also write to PBO for next frame
      webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbos[1]);
      webglContext.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        webglContext.RGBA,
        webglContext.UNSIGNED_BYTE,
        0,
      );

      webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, null);

      // Move to async mode for next frame
      pboRef.current.index = 1;
      pboRef.current.initialized = true;
      return;
    }

    // Subsequent frames: use async PBO readback
    const readIndex = index;
    const writeIndex = (index + 1) % 2;

    // Read from the previous frame's PBO
    webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbos[readIndex]);
    webglContext.getBufferSubData(webglContext.PIXEL_PACK_BUFFER, 0, bufferRef.current);

    props.onFrame(bufferRef.current, { canvasWidth: canvas.width, canvasHeight: canvas.height });

    // Request pixels for the current frame into the next PBO (non-blocking)
    webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbos[writeIndex]);
    webglContext.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      webglContext.RGBA,
      webglContext.UNSIGNED_BYTE,
      0, // offset into the PBO
    );

    webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, null);

    // Rotate buffers
    pboRef.current.index = writeIndex;
  });

  return null;
}
