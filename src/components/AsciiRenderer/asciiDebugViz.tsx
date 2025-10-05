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

  const gridSamplingPoints = config.generateGridSamplingPoints();

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

        // Generate grid cells if not provided
        const gridCells = metadata.samplingConfig.gridCells || (() => {
          const cells = [];
          for (let row = 0; row < metadata.samplingConfig.gridRows; row++) {
            for (let col = 0; col < metadata.samplingConfig.gridCols; col++) {
              cells.push({ row, col });
            }
          }
          return cells;
        })();

        gridCells.forEach((cell, vectorIndex) => {
          const [xOff, yOff, cellWidth, cellHeight] = config.samplingGridCellOffset(
            cell.row,
            cell.col,
            metadata.samplingConfig.gridRows,
            metadata.samplingConfig.gridCols
          );
          const cellX = sampleRectLeft + xOff;
          const cellY = sampleRectTop + yOff;

          if (options.showSamplingCircles !== "none") {
            // Draw grid cell outline
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);

            // Fill grid cell with intensity
            const vectorToUse =
              visualizationMode === "crunched"
                ? samplingVector.samplingVector
                : samplingVector.rawSamplingVector;
            const intensity = vectorToUse[vectorIndex] * 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
          }

          if (options.showSamplingPoints) {
            const cellCenterX = cellX + cellWidth / 2;
            const cellCenterY = cellY + cellHeight / 2;

            // Scale sampling points to fit within the cell dimensions
            const maxRadius = Math.min(cellWidth, cellHeight) / 2;

            ctx.fillStyle = colors.blue200;
            for (const point of gridSamplingPoints) {
              const scaledX = (point.x / config.samplePointRadius) * maxRadius;
              const scaledY = (point.y / config.samplePointRadius) * maxRadius;
              ctx.beginPath();
              ctx.arc(cellCenterX + scaledX, cellCenterY + scaledY, samplingPointRadius + 1.25, 0, TAU);
              ctx.fill();
            }

            const subsamples = samplingVector.samplingVectorSubsamples[vectorIndex];
            gridSamplingPoints.forEach((point, pointIndex) => {
              const scaledX = (point.x / config.samplePointRadius) * maxRadius;
              const scaledY = (point.y / config.samplePointRadius) * maxRadius;
              const lightness = Math.floor(subsamples[pointIndex] * 255);
              ctx.fillStyle = `rgb(${lightness}, ${lightness}, ${lightness})`;

              ctx.beginPath();
              ctx.arc(cellCenterX + scaledX, cellCenterY + scaledY, samplingPointRadius, 0, TAU);
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
