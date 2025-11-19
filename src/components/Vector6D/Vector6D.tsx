import React from "react";
import { useStyles } from "../../utils/styles";
import Vector6DStyles from "./Vector6D.styles";
import { lerp } from "../../math/lerp";

interface Vector6DProps {
  samplingVector: number[];
  externalVector?: number[];
}

export const Vector6D: React.FC<Vector6DProps> = ({ samplingVector, externalVector }) => {
  const s = useStyles(Vector6DStyles);

  if (!samplingVector || samplingVector.length !== 6) {
    throw new Error("'samplingVector' must have exactly 6 elements");
  }
  if (externalVector && externalVector.length !== 6) {
    throw new Error("'externalVector' must have exactly 6 elements");
  }

  const circleRadius = 34;
  const circleSpacing = 75;
  const diagonalOffset = 54;

  // Diagonal offset directions for each index position
  // Returns [dx, dy] offset multipliers
  const getDiagonalDirection = (index: number): [number, number] => {
    const directions: [number, number][] = [
      [-1, -1], // Index 0: top-left
      [1, -1], // Index 1: top-right
      [-1.37, 0], // Index 2: left (middle row, centered vertically)
      [1.37, 0], // Index 3: right (middle row, centered vertically)
      [-1, 1], // Index 4: bottom-left
      [1, 1], // Index 5: bottom-right
    ];
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
  const circles = [
    ...samplingVector.map((value, index) => ({ value, index, external: false })),
    ...(externalVector?.map((value, index) => ({ value, index, external: true })) || []),
  ];

  return (
    <div className={s("containerOuter", { hasExternal: !!externalVector })}>
      <div className={s("container")} style={{ paddingBottom: `${paddingBottom}%` }}>
        {circles.map(({ value, index, external }) => {
          const [baseCx, baseCy] = getCirclePosition(index);

          let cx = baseCx;
          let cy = baseCy;
          if (external) {
            const [xOff, yOff] = getDiagonalDirection(index);
            cx = baseCx + xOff * diagonalOffset;
            cy = baseCy + yOff * diagonalOffset;
          }

          return (
            <div
              key={`${external ? "external" : "sampling"}-${index}`}
              style={{
                position: "absolute",
                left: `${((cx - circleRadius) / containerWidth) * 100}%`,
                top: `${((cy - circleRadius) / containerHeight) * 100}%`,
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
      </div>
    </div>
  );
};
