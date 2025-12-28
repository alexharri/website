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
    syncs: (WebGLSync | null)[];
    index: number;
    bufferSize: number;
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
      // Clean up old PBOs and syncs if they exist
      if (pboRef.current) {
        pboRef.current.pbos.forEach((pbo) => webglContext.deleteBuffer(pbo));
        pboRef.current.syncs.forEach((sync) => {
          if (sync) webglContext.deleteSync(sync);
        });
      }

      // Create 3 PBOs for triple buffering
      const pbos = [
        webglContext.createBuffer()!,
        webglContext.createBuffer()!,
        webglContext.createBuffer()!,
      ];
      const syncs: (WebGLSync | null)[] = [null, null, null];

      // Allocate storage for all PBOs
      pbos.forEach((pbo) => {
        webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbo);
        webglContext.bufferData(webglContext.PIXEL_PACK_BUFFER, len, webglContext.STREAM_READ);
      });

      webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, null);

      pboRef.current = { pbos, syncs, index: 0, bufferSize: len };
    }

    const { pbos, syncs, index } = pboRef.current;

    // Subsequent frames: use async PBO readback with fence checking
    const readIndex = index;
    const writeIndex = (index + 1) % 3;

    // Check if the previous frame's PBO is ready to read
    const readSync = syncs[readIndex];
    if (readSync) {
      const status = webglContext.getSyncParameter(readSync, webglContext.SYNC_STATUS);

      if (status === webglContext.SIGNALED) {
        // GPU has finished - safe to read
        webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, pbos[readIndex]);
        webglContext.getBufferSubData(webglContext.PIXEL_PACK_BUFFER, 0, bufferRef.current);
        webglContext.bindBuffer(webglContext.PIXEL_PACK_BUFFER, null);

        props.onFrame(bufferRef.current, {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
        });

        // Clean up the sync object
        webglContext.deleteSync(readSync);
        pboRef.current.syncs[readIndex] = null;
      } else {
        // GPU not ready yet - skip this frame's read (keep previous data)
        return;
      }
    }

    // Before writing, ensure the write buffer is available
    const existingWriteSync = pboRef.current.syncs[writeIndex];
    if (existingWriteSync) {
      // Wait for the previous write to this buffer to complete
      // Use small timeout to avoid INVALID_OPERATION error
      webglContext.clientWaitSync(existingWriteSync, webglContext.SYNC_FLUSH_COMMANDS_BIT, 0);
      webglContext.deleteSync(existingWriteSync);
      pboRef.current.syncs[writeIndex] = null;
    }

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

    // Create fence for this write
    const writeSync = webglContext.fenceSync(webglContext.SYNC_GPU_COMMANDS_COMPLETE, 0);
    webglContext.flush();
    pboRef.current.syncs[writeIndex] = writeSync;

    // Rotate buffers
    pboRef.current.index = writeIndex;
  });

  return null;
}
