import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { AsciiRenderConfig } from "./renderConfig";

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
  config: AsciiRenderConfig,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || samplingData.length === 0) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = config.canvasWidth * dpr;
  canvas.height = config.canvasHeight * dpr;
  canvas.style.width = config.canvasWidth + "px";
  canvas.style.height = config.canvasHeight + "px";

  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);

  const metadata = getAlphabetMetadata(config.alphabet);

  samplingData.forEach((samplingDataRow, row) => {
    samplingDataRow.forEach(({ samplingVector, externalSamplingVector }, col) => {
      const [sampleRectLeft, sampleRectTop] = config.sampleRectPosition(col, row);

      metadata.samplingConfig.points.forEach((samplingPoint, i) => {
        const [xOff, yOff] = config.samplePointOffset(samplingPoint);
        const x = sampleRectLeft + xOff;
        const y = sampleRectTop + yOff;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // ctx.fillStyle = colors.background200;
        // ctx.beginPath();
        // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        // ctx.fill();

        const intensity = samplingVector[i] * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.beginPath();
        ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
        ctx.fill();
      });

      const externalPoints =
        "externalPoints" in metadata.samplingConfig ? metadata.samplingConfig.externalPoints : [];
      for (const [i, externalPoint] of externalPoints.entries()) {
        const [xOff, yOff] = config.samplePointOffset(externalPoint);
        const x = sampleRectLeft + xOff;
        const y = sampleRectTop + yOff;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // ctx.fillStyle = colors.background200;
        // ctx.beginPath();
        // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        // ctx.fill();

        const intensity = externalSamplingVector[i] * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.beginPath();
        ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  });
}
