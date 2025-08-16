import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";

interface Props {
  onCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

export function SamplingPointCanvas(props: Props) {
  return (
    <canvas
      ref={props.onCanvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}

export function renderSamplingPoints(
  canvas: HTMLCanvasElement,
  samplingData: CharacterSamplingData[][],
  alphabet: AlphabetName,
  fontSize: number,
  characterWidthMultiplier: number,
  characterHeightMultiplier: number,
  characterWidth: number,
  containerWidth: number,
  containerHeight: number,
  offsetX: number,
  offsetY: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || samplingData.length === 0) return;

  const dpr = window.devicePixelRatio || 1;

  // Set canvas size to match container, accounting for device pixel ratio
  canvas.width = containerWidth * dpr;
  canvas.height = containerHeight * dpr;

  // Scale canvas back down using CSS
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;

  // Scale the drawing context so everything draws at the correct size
  ctx.scale(dpr, dpr);

  // Clear canvas
  ctx.clearRect(0, 0, containerWidth, containerHeight);

  const metadata = getAlphabetMetadata(alphabet);

  samplingData.forEach((row, y) => {
    row.forEach(({ samplingVector, externalSamplingVector }, x) => {
      const sampleRectWidth = fontSize * metadata.width;
      const sampleRectHeight = fontSize * metadata.height;
      const boxWidth = sampleRectWidth * characterWidthMultiplier;
      const boxHeight = sampleRectHeight * characterHeightMultiplier;
      const letterWidth = characterWidth;
      const difference = (metadata.width * characterWidthMultiplier - letterWidth) / 2;
      const left = x * boxWidth - difference * fontSize + offsetX;
      const top = y * boxHeight + offsetY;
      const sampleRectXOff = (boxWidth - sampleRectWidth) / 2;
      const sampleRectYOff = (boxHeight - sampleRectHeight) / 2;
      const samplingCircleWidth = fontSize * metadata.samplingConfig.circleRadius * 2;

      const sampleRectLeft = left + sampleRectXOff;
      const sampleRectTop = top + sampleRectYOff;

      metadata.samplingConfig.points.forEach(({ x: pointX, y: pointY }, i) => {
        const centerX = sampleRectLeft + pointX * sampleRectWidth;
        const centerY = sampleRectTop + pointY * sampleRectHeight;
        const radius = samplingCircleWidth / 2;

        // Draw border circle
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw background
        // ctx.fillStyle = colors.background200;
        // ctx.beginPath();
        // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        // ctx.fill();

        // Draw intensity overlay
        const intensity = samplingVector[i] * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      });

      const externalPoints =
        "externalPoints" in metadata.samplingConfig ? metadata.samplingConfig.externalPoints : [];
      for (const [i, { x, y }] of externalPoints.entries()) {
        const centerX = sampleRectLeft + x * sampleRectWidth;
        const centerY = sampleRectTop + y * sampleRectHeight;
        const radius = samplingCircleWidth / 2;

        // Draw border circle
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw background
        // ctx.fillStyle = colors.background200;
        // ctx.beginPath();
        // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        // ctx.fill();

        // Draw intensity overlay
        const intensity = externalSamplingVector[i] * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  });
}
