import { useEffect, useRef } from "react";
import { useStyles } from "../utils/styles";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

function readPixelFromBuffer(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
) {
  const pixelX = Math.floor(x * canvasWidth);
  const pixelY = Math.floor((1 - y) * canvasHeight);
  const index = (pixelY * canvasWidth + pixelX) * 4;

  if (index >= 0 && index < pixelBuffer.length - 3) {
    return (
      0x000000 | (pixelBuffer[index] << 16) | (pixelBuffer[index + 1] << 8) | pixelBuffer[index + 2]
    );
  }
  return 0x000000;
}

function lightness(hexColor: number): number {
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >> 8) & 0xff;
  const b = hexColor & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getAsciiChar(lightness: number): string {
  const chars = " .:-=+*#%@";
  const index = Math.floor(lightness * (chars.length - 1));
  return chars[index] === " " ? "&nbsp;" : chars[index];
}

function samplePixelWithAntiAliasing(
  pixelBuffer: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  quality: number,
): number {
  let totalLightness = 0;
  let sampleCount = 0;

  for (let sy = 0; sy < quality; sy++) {
    for (let sx = 0; sx < quality; sx++) {
      const offsetX = (sx + 0.5) / quality;
      const offsetY = (sy + 0.5) / quality;

      const x_t = (x + offsetX) / W;
      const y_t = (y + offsetY) / H;

      const hexColor = readPixelFromBuffer(pixelBuffer, canvasWidth, canvasHeight, x_t, y_t);
      totalLightness += lightness(hexColor);
      sampleCount++;
    }
  }

  return totalLightness / sampleCount;
}

const H = 20;
const W = 50;
const ANTI_ALIASING_QUALITY = 3;

export function AsciiRenderer(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    container.innerHTML = "";

    const rows: HTMLSpanElement[][] = [];

    for (let i = 0; i < H; i++) {
      const row: HTMLSpanElement[] = [];
      rows.push(row);

      const rowEl = document.createElement("div");
      rowEl.className = s("row");
      container.appendChild(rowEl);

      for (let j = 0; j < W; j++) {
        const charEl = document.createElement("span");
        charEl.className = s("char");
        row.push(charEl);
        rowEl.appendChild(charEl);
        charEl.innerHTML = "1";
      }
    }

    let mounted = true;

    function tick() {
      if (!mounted) return;
      requestAnimationFrame(tick);

      const canvas = props.canvasRef.current;
      const gl = canvas?.getContext("webgl") || canvas?.getContext("webgl2");
      if (!canvas || !gl) return;

      const pixelBuffer = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

      for (let y = 0; y < H; y++) {
        const row = rows[y];
        for (let x = 0; x < W; x++) {
          const avgLightness = samplePixelWithAntiAliasing(
            pixelBuffer,
            canvas.width,
            canvas.height,
            x,
            y,
            ANTI_ALIASING_QUALITY,
          );
          const char = row[x];
          char.innerHTML = getAsciiChar(avgLightness);
          char.style.color = "white";
        }
      }
    }
    tick();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      data-ascii
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    ></div>
  );
}
