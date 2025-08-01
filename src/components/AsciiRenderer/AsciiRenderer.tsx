import { useEffect, useRef, useState } from "react";
import { AsciiRendererStyles } from "./AsciiRenderer.styles";
import { generateAsciiChars } from "./ascii/generateAsciiChars";
import { AlphabetName, getAvailableAlphabets } from "./alphabets/AlphabetManager";
import { useStyles } from "../../utils/styles";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  alphabet?: AlphabetName;
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
  const [selectedAlphabet, setSelectedAlphabet] = useState<AlphabetName>(props.alphabet || 'default');
  const [availableAlphabets] = useState<AlphabetName[]>(getAvailableAlphabets());

  // Handle alphabet switching
  const handleAlphabetChange = async (newAlphabet: AlphabetName) => {
    setSelectedAlphabet(newAlphabet);
    // The alphabet switching will be handled in the CharacterMatcher
  };

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
        gl = (canvas as any).__webglContext || 
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

      const asciiString = generateAsciiChars(pixelBuffer, canvas.width, canvas.height, W, H, selectedAlphabet);
      preEl.textContent = asciiString;
    }
    tick();

    return () => {
      mounted = false;
    };
  }, [selectedAlphabet]);

  return (
    <>
      {/* Alphabet selector dropdown */}
      <select
        value={selectedAlphabet}
        onChange={(e) => handleAlphabetChange(e.target.value as AlphabetName)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          padding: "4px 8px",
          fontSize: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          border: "1px solid #333",
          borderRadius: "4px",
        }}
      >
        {availableAlphabets.map((alphabet) => (
          <option key={alphabet} value={alphabet}>
            {alphabet.charAt(0).toUpperCase() + alphabet.slice(1)}
          </option>
        ))}
      </select>

      {/* ASCII output container */}
      <div
        data-ascii
        ref={ref}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        className={s("container")}
      ></div>
    </>
  );
}
