import { useEffect, useRef } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars } from "./ascii/generateAsciiChars";
import { AlphabetName } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";

interface Props {
  alphabet: AlphabetName;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFrameRef: React.MutableRefObject<null | ((buffer: Uint8Array) => void)>;
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
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let charDimensions: { width: number; height: number } | null = null;

    props.onFrameRef.current = function onFrame(pixelBuffer: Uint8Array): void {
      const container = ref.current;
      const preEl = preRef.current;
      if (!container || !preEl) return;

      const canvas = props.canvasRef.current;
      if (!canvas) return;

      if (!charDimensions) {
        charDimensions = measureCharacterSize(preEl);
      }

      const containerRect = container?.getBoundingClientRect();
      if (!containerRect) return;
      const W = Math.floor(containerRect.width / charDimensions.width);
      const H = Math.floor(containerRect.height / charDimensions.height);

      const asciiString = generateAsciiChars(
        pixelBuffer,
        canvas.width,
        canvas.height,
        W,
        H,
        props.alphabet,
      );
      preEl.textContent = asciiString;
    };
  }, [props.alphabet]);

  return (
    <div
      data-ascii
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className={s("container")}
    >
      <pre ref={preRef} className={s("pre")} />
    </div>
  );
}
