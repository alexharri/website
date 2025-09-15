import React from "react";
import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { AsciiRenderConfig } from "./renderConfig";

interface Props {
  onCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  transparent?: boolean;
}

export function PixelateCanvas(props: Props) {
  return (
    <canvas
      ref={props.onCanvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 40,
        transition: "opacity 0.3s",
        opacity: props.transparent ? 0.5 : 1,
      }}
    />
  );
}

export function renderPixelate(
  canvas: HTMLCanvasElement,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = config.canvasWidth * dpr;
  canvas.height = config.canvasHeight * dpr;
  canvas.style.width = config.canvasWidth + "px";
  canvas.style.height = config.canvasHeight + "px";

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);

  if (samplingData.length !== config.rows) return;
  if (samplingData[0]?.length !== config.cols) return;

  for (let col = 0; col < config.cols; col++) {
    const x = config.offsetX + config.boxWidth * col;
    for (let row = 0; row < config.rows; row++) {
      const item = samplingData[row][col];
      const l = item.samplingVector[0] * 255;
      const y = config.offsetY + config.boxHeight * row;
      ctx.beginPath();
      ctx.rect(x, y, config.boxWidth, config.boxHeight);
      ctx.fillStyle = `rgb(${l}, ${l}, ${l})`;
      ctx.fill();
    }
  }
}