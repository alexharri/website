import { useContext } from "react";
import { FiberContext } from "./ThreeProvider";

interface Props {
  onFrame: (canvas: HTMLCanvasElement) => void;
}

export function FrameReader(props: Props) {
  const FIBER = useContext(FiberContext);
  FIBER.useFrame((state) => props.onFrame(state.gl.domElement));
  return null;
}
