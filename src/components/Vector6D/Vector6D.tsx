import React from "react";
import { useStyles } from "../../utils/styles";
import Vector6DStyles from "./Vector6D.styles";
import { lerp } from "../../math/lerp";
import { colors } from "../../utils/cssVariables";

interface Vector6DProps {
  samplingVector: number[];
  externalVector?: number[];
  affectsMapping?: number[][];
}

export const Vector6D: React.FC<Vector6DProps> = ({
  samplingVector,
  externalVector,
  affectsMapping,
}) => {
  const s = useStyles(Vector6DStyles);

  if (!samplingVector || samplingVector.length !== 6) {
    throw new Error("'samplingVector' must have exactly 6 elements");
  }
  if (externalVector && externalVector.length !== 6 && externalVector.length !== 10) {
    throw new Error("'externalVector' must have exactly 6 elements");
  }

  const circleRadius = 34;
  const circleSpacing = 75;
  const diagonalOffset = 54;

  // Diagonal offset directions for each index position
  // Returns [dx, dy] offset multipliers
  const directions: [number, number][] =
    externalVector?.length === 6
      ? [
          [-1, -1],
          [1, -1],
          [-1.37, 0],
          [1.37, 0],
          [-1, 1],
          [1, 1],
        ]
      : [
          [-0.7, -1.7],
          [0.7, -1.7],
          [-1.7, -0.7],
          [1.7, -0.7],
          [-1.7, 0],
          [1.7, 0],
          [-1.7, 0.7],
          [1.7, 0.7],
          [-0.7, 1.7],
          [0.7, 1.7],
        ];

  const externalRelativeTo =
    externalVector?.length === 6 ? [0, 1, 2, 3, 4, 5] : [0, 1, 0, 1, 2, 3, 4, 5, 4, 5];

  const getDiagonalDirection = (index: number): [number, number] => {
    return directions[index] || [1, 1];
  };

  // Calculate exact bounds - include diagonal offset only if external vectors are present
  let leftExtent = circleRadius;
  let rightExtent = circleRadius;
  let topExtent = circleRadius;
  let bottomExtent = circleRadius;

  if (externalVector) {
    const allDirections = [0, 1, 2, 3, 4, 5].map(getDiagonalDirection);
    leftExtent =
      Math.max(...allDirections.map(([dx]) => (dx < 0 ? Math.abs(dx) : 0))) * diagonalOffset +
      circleRadius;
    rightExtent =
      Math.max(...allDirections.map(([dx]) => (dx > 0 ? dx : 0))) * diagonalOffset + circleRadius;
    topExtent =
      Math.max(...allDirections.map(([, dy]) => (dy < 0 ? Math.abs(dy) : 0))) * diagonalOffset +
      circleRadius;
    bottomExtent =
      Math.max(...allDirections.map(([, dy]) => (dy > 0 ? dy : 0))) * diagonalOffset + circleRadius;
  }

  // Calculate container dimensions to fit exactly
  const cols = 2;
  const rows = 3;
  const containerWidth = leftExtent + (cols - 1) * circleSpacing + rightExtent;
  const containerHeight = topExtent + (rows - 1) * circleSpacing + bottomExtent;

  // Calculate positions for 3×2 grid (2 columns, 3 rows)
  // Returns center position [x, y]
  const getCirclePosition = (index: number): [number, number] => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    return [leftExtent + col * circleSpacing, topExtent + row * circleSpacing];
  };

  const paddingBottom = (containerHeight / containerWidth) * 100;

  // Combine both vectors into a single array with metadata
  const circles = samplingVector.map((value, index) => ({
    value,
    index,
    external: false,
    position: getCirclePosition(index),
  }));

  const externalCircles =
    externalVector?.map((value, index) => {
      const [baseX, baseY] = getCirclePosition(externalRelativeTo[index]);
      const [xOff, yOff] = getDiagonalDirection(index);

      return {
        value,
        index,
        external: true,
        position: [baseX + xOff * diagonalOffset, baseY + yOff * diagonalOffset],
      };
    }) || [];

  return (
    <div className={s("containerOuter", { hasExternal: !!externalVector })}>
      <div className={s("container")} style={{ paddingBottom: `${paddingBottom}%` }}>
        {[...circles, ...externalCircles].map(({ value, index, external, position: [x, y] }) => {
          return (
            <div
              key={`${external ? "external" : "sampling"}-${index}`}
              style={{
                position: "absolute",
                left: `${((x - circleRadius) / containerWidth) * 100}%`,
                top: `${((y - circleRadius) / containerHeight) * 100}%`,
                width: `${((circleRadius * 2) / containerWidth) * 100}%`,
              }}
            >
              <div
                className={s("circle", { external })}
                style={{
                  backgroundColor: external
                    ? `rgba(220, 150, 170, ${lerp(0, 0.6, value)})`
                    : `rgba(185, 219, 250, ${lerp(0, 0.6, value)})`,
                }}
              />
              <div className={s("circleText")}>{value.toFixed(2)}</div>
            </div>
          );
        })}
        {affectsMapping?.map((externalIndices, circleIndex) => {
          const [xTo, yTo] = circles[circleIndex].position;

          return externalIndices.map((externalIndex) => {
            const [xFrom, yFrom] = externalCircles[externalIndex].position;

            // Calculate direction vector
            const dx = xTo - xFrom;
            const dy = yTo - yFrom;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Normalize direction and offset by circle radius
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            const adjustedXFrom = xFrom + normalizedDx * circleRadius;
            const adjustedYFrom = yFrom + normalizedDy * circleRadius;
            const adjustedLength = distance - 2 * circleRadius;

            const arrowHeadSize = 8;

            // Calculate arrowhead tip position (end of the line)
            const arrowTipX = adjustedXFrom + normalizedDx * adjustedLength;
            const arrowTipY = adjustedYFrom + normalizedDy * adjustedLength;

            return (
              <React.Fragment key={`arrow-${circleIndex}-${externalIndex}`}>
                {/* Arrow line */}
                <div
                  style={{
                    position: "absolute",
                    left: `${(adjustedXFrom / containerWidth) * 100}%`,
                    top: `${(adjustedYFrom / containerHeight) * 100}%`,
                    width: `${(adjustedLength / containerWidth) * 100}%`,
                    height: "2px",
                    backgroundColor: colors.blue,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle}deg)`,
                  }}
                />
                {/* Arrow head - left side */}
                <div
                  style={{
                    position: "absolute",
                    left: `${(arrowTipX / containerWidth) * 100}%`,
                    top: `${(arrowTipY / containerHeight) * 100}%`,
                    width: `${(arrowHeadSize / containerWidth) * 100}%`,
                    height: "2px",
                    backgroundColor: colors.blue,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle + 180 - 45}deg) translate(0px, -2px)`,
                  }}
                />
                {/* Arrow head - right side */}
                <div
                  style={{
                    position: "absolute",
                    left: `${(arrowTipX / containerWidth) * 100}%`,
                    top: `${(arrowTipY / containerHeight) * 100}%`,
                    width: `${(arrowHeadSize / containerWidth) * 100}%`,
                    height: "2px",
                    backgroundColor: colors.blue,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle + 180 + 45}deg) translate(-2px, -2px)`,
                  }}
                />
              </React.Fragment>
            );
          });
        })}
      </div>
    </div>
  );
};
