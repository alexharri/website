import { useEffect, useRef } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars } from "./ascii/generateAsciiChars";
import { AlphabetName } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  alphabet: AlphabetName;
}

function measureCharacterSize(element: HTMLElement): { width: number; height: number } {
  const testChar = document.createElement("span");
  testChar.style.fontFamily = getComputedStyle(element).fontFamily;
  testChar.style.fontSize = getComputedStyle(element).fontSize;
  testChar.style.lineHeight = getComputedStyle(element).lineHeight;
  testChar.style.visibility = "hidden";
  testChar.style.position = "absolute";
  testChar.textContent = "M";

  document.body.appendChild(testChar);
  const rect = testChar.getBoundingClientRect();
  document.body.removeChild(testChar);

  return { width: rect.width, height: rect.height };
}

export function AsciiRenderer(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const s = useStyles(AsciiRendererStyles);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    container.innerHTML = "";

    const preEl = document.createElement("pre");
    preEl.className = s("pre");
    container.appendChild(preEl);

    let mounted = true;
    let charDimensions: { width: number; height: number } | null = null;

    function tick() {
      if (!mounted) return;
      requestAnimationFrame(tick);

      const canvas = props.canvasRef.current;
      if (!canvas) return;

      // Try to get the existing WebGL context from the canvas
      // Three.js should have already created this context
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

      // Try to access the existing context without creating a new one
      try {
        // This will return the existing context if one exists
        gl =
          (canvas as any).__webglContext ||
          canvas.getContext("webgl2") ||
          canvas.getContext("webgl");
      } catch (error) {
        console.warn("Could not access WebGL context:", error);
        return;
      }

      if (!gl) return;

      if (!charDimensions) {
        charDimensions = measureCharacterSize(preEl);
      }

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;
      const W = Math.floor(containerRect.width / charDimensions.width);
      const H = Math.floor(containerRect.height / charDimensions.height);

      const pixelBuffer = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

      const asciiString = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        W,
        H,
        props.alphabet,
      );
      preEl.textContent = asciiString;
    }
    tick();

    return () => {
      mounted = false;
    };
  }, [props.alphabet]);

  return (
    <div
      data-ascii
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    ></div>
  );
}
