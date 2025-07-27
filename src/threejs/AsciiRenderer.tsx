import { useEffect, useRef } from "react";
import { useStyles } from "../utils/styles";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

function readPixelColor(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  x: number,
  y: number,
) {
  const pixels = new Uint8Array(4);
  const pixelX = Math.floor(x * canvas.width);
  const pixelY = Math.floor((1 - y) * canvas.height);
  gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  return 0x000000 | (pixels[0] << 16) | (pixels[1] << 8) | pixels[2];
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

const H = 20;
const W = 50;

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

      for (let y = 0; y < H; y++) {
        const row = rows[y];
        for (let x = 0; x < W; x++) {
          let x_t = x / (W - 1);
          let y_t = y / (H - 1);
          const hexColor = readPixelColor(canvas, gl, x_t, y_t);
          const lightnessValue = lightness(hexColor);
          const char = row[x];
          char.innerHTML = getAsciiChar(lightnessValue);
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
