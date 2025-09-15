import { CharacterSamplingData } from "./ascii/generateAsciiChars";
import { getAlphabetMetadata } from "./alphabets/AlphabetManager";
import { AsciiRenderConfig } from "./renderConfig";
import { DebugVizOptions, SamplingPointVisualizationMode } from "./types";
import { colors } from "../../utils/cssVariables";
import { hexToRgbaString } from "../../utils/color";

interface Props {
  onCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const TAU = 2 * Math.PI;

export function AsciiDebugVizCanvas(props: Props) {
  return (
    <canvas
      ref={props.onCanvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}

export function renderAsciiDebugViz(
  canvas: HTMLCanvasElement,
  samplingData: CharacterSamplingData[][],
  config: AsciiRenderConfig,
  options: DebugVizOptions,
  visualizationMode?: SamplingPointVisualizationMode,
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

  const metadata = getAlphabetMetadata(config.alphabet);

  const circleSamplingPoints = config.generateCircleSamplingPoints();

  const samplingPointRadius = 2.5;

  if (options.showGrid) {
    ctx.fillStyle = hexToRgbaString(colors.blue, 0.5);
    ctx.beginPath();
    for (let row = 1; row < config.rows; row++) {
      const y = config.offsetY + config.boxHeight * row;
      ctx.rect(0, y, config.canvasWidth, 1);
    }
    for (let col = 1; col < config.cols; col++) {
      const x = config.offsetX + config.boxWidth * col;
      ctx.rect(x, 0, 1, config.canvasHeight);
    }
    ctx.fill();
  }

  for (let col = 0; col < config.cols; col++) {
    for (let row = 0; row < config.rows; row++) {
      const [sampleRectLeft, sampleRectTop] = config.sampleRectPosition(col, row);
      if (options.showSamplingCircles || options.showSamplingPoints) {
        const samplingVector = samplingData[row][col];
        metadata.samplingConfig.points.forEach((samplingCircle, i) => {
          const [xOff, yOff] = config.samplingCircleOffset(samplingCircle);
          const x = sampleRectLeft + xOff;
          const y = sampleRectTop + yOff;

          if (options.showSamplingCircles !== "none") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, config.samplePointRadius, 0, TAU);
            ctx.stroke();

            // ctx.fillStyle = colors.background200;
            // ctx.beginPath();
            // ctx.arc(centerX, centerY, radius, 0, TAU);
            // ctx.fill();

            const vectorToUse =
              visualizationMode === "crunched"
                ? samplingVector.samplingVector
                : samplingVector.rawSamplingVector;
            const intensity = vectorToUse[i] * 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            ctx.beginPath();
            ctx.arc(x, y, config.samplePointRadius, 0, TAU);
            ctx.fill();
          }

          if (options.showSamplingPoints) {
            ctx.fillStyle = colors.blue200;
            for (const point of circleSamplingPoints) {
              ctx.beginPath();
              ctx.arc(x + point.x, y + point.y, samplingPointRadius + 1.25, 0, TAU);
              ctx.fill();
            }

            const subsamples = samplingVector.samplingVectorSubsamples[i];
            circleSamplingPoints.forEach((point, pointIndex) => {
              const lightness = Math.floor(subsamples[pointIndex] * 255);
              ctx.fillStyle = `rgb(${lightness}, ${lightness}, ${lightness})`;

              ctx.beginPath();
              ctx.arc(x + point.x, y + point.y, samplingPointRadius, 0, TAU);
              ctx.fill();
              ctx.closePath();
            });
          }
        });
      }
    }
  }

  // samplingData.forEach((samplingDataRow, row) => {
  //   samplingDataRow.forEach(({ externalSamplingVector }, col) => {
  //     const [sampleRectLeft, sampleRectTop] = config.sampleRectPosition(col, row);

  //     if (options.showExternalSamplingCircles) {
  //       const externalPoints =
  //         "externalPoints" in metadata.samplingConfig ? metadata.samplingConfig.externalPoints : [];
  //       for (const [i, externalPoint] of externalPoints.entries()) {
  //         const [xOff, yOff] = config.samplingCircleOffset(externalPoint);
  //         const x = sampleRectLeft + xOff;
  //         const y = sampleRectTop + yOff;

  //         ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  //         ctx.lineWidth = 1;
  //         ctx.beginPath();
  //         ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
  //         ctx.stroke();

  //         // ctx.fillStyle = colors.background200;
  //         // ctx.beginPath();
  //         // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  //         // ctx.fill();

  //         const intensity = externalSamplingVector[i] * 0.7;
  //         ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
  //         ctx.beginPath();
  //         ctx.arc(x, y, config.samplePointRadius, 0, 2 * Math.PI);
  //         ctx.fill();

  //         if (options.showSamplingPoints) {
  //           for (const point of circleSamplingPoints) {
  //             ctx.fillStyle = "#ff0000";
  //             ctx.beginPath();
  //             ctx.arc(x + point.x, y + point.y, samplingPointRadius, 0, 2 * Math.PI);
  //             ctx.fill();
  //           }
  //         }
  //       }
  //     }
  //   });
  // });
}
