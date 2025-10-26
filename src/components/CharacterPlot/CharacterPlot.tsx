// Vibe coded with Claude

import React, { useState, useMemo, useCallback } from "react";
import { useStyles } from "../../utils/styles";
import { CharacterPlotStyles } from "./CharacterPlot.styles";
import {
  AlphabetName,
  getAlphabetCharacterVectors,
} from "../AsciiRenderer/alphabets/AlphabetManager";

interface CharacterPlotProps {
  alphabet?: AlphabetName;
  characters?: string;
  max?: number;
  highlight?: string;
  showHoverLine?: boolean;
}

/**
 * Calculate a "nice" tick step size for axis labels and grid lines.
 * Works for any max value by finding human-readable round numbers.
 */
function getNiceTickStep(max: number, availablePixels: number, minTickSpacingPx = 40): number {
  // Calculate rough step size in data units
  const roughStep = (max / availablePixels) * minTickSpacingPx;

  // Handle edge case: max is very small or zero
  if (roughStep <= 0 || !isFinite(roughStep)) {
    return max / 5; // Default to 5 divisions
  }

  // Find the order of magnitude
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));

  // Normalize to [1, 10) range
  const normalized = roughStep / magnitude;

  // Choose nearest nice number: 1, 2, 2.5, 5, or 10
  let niceNormalized;
  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 2.5) {
    niceNormalized = 2.5;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  const niceStep = niceNormalized * magnitude;

  // Ensure we have at least 2 ticks (step shouldn't exceed max/2)
  if (niceStep > max / 2) {
    return getNiceTickStep(max, availablePixels, minTickSpacingPx * 0.5);
  }

  return niceStep;
}

export const CharacterPlot: React.FC<CharacterPlotProps> = ({
  alphabet = "two-samples",
  characters,
  max = 1,
  highlight: highlight = "",
  showHoverLine = false,
}) => {
  const s = useStyles(CharacterPlotStyles);
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(600);

  // Set of characters that should be highlighted by default
  const highlightedSet = useMemo(() => new Set(highlight.split("")), [highlight]);

  // Load and filter characters
  const characterData = useMemo(() => {
    const allChars = getAlphabetCharacterVectors(alphabet);

    if (!characters) {
      return allChars;
    }

    // Filter to only the hand-picked characters
    const charSet = new Set(characters.split(""));
    return allChars.filter((c) => charSet.has(c.char));
  }, [alphabet, characters]);

  // Find nearest character to mouse position
  const findNearestCharacter = useCallback(
    (svgX: number, svgY: number, pixelToData: number): string | null => {
      let minDist = Infinity;
      let nearest: string | null = null;

      characterData.forEach((char) => {
        const [x, y] = char.vector; // vector = [upper, lower]
        // Standard 2D vector plotting: first element = X, second = Y
        const dist = Math.sqrt((x - svgX) ** 2 + (y - svgY) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = char.char;
        }
      });

      // When showHoverLine is false, only return nearest if within max distance
      // Max distance is 20 pixels, converted to data units
      if (!showHoverLine) {
        const maxDistanceInPixels = 20;
        const maxDistance = maxDistanceInPixels * pixelToData;
        if (minDist > maxDistance) {
          return null;
        }
      }

      return nearest;
    },
    [characterData, showHoverLine],
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();

      // Get viewBox dimensions
      const viewBox = svg.viewBox.baseVal;
      const vbX = viewBox.x;
      const vbY = viewBox.y;
      const vbWidth = viewBox.width;
      const vbHeight = viewBox.height;

      // Convert mouse position to viewBox coordinates
      const mouseX = ((e.clientX - rect.left) / rect.width) * vbWidth + vbX;
      const mouseY = ((e.clientY - rect.top) / rect.height) * vbHeight + vbY;

      // Convert to data coordinates (Y-axis is flipped in rendering)
      const dataX = mouseX;
      const dataY = max - mouseY;

      // Calculate pixel-to-data scale for distance threshold
      const pixelToData = vbWidth / rect.width;

      const nearest = findNearestCharacter(dataX, dataY, pixelToData);
      setHoveredChar(nearest);
      setMousePos({ x: dataX, y: dataY });
    },
    [max, findNearestCharacter],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredChar(null);
    setMousePos(null);
  }, []);

  // Track SVG width for font size calculation
  React.useEffect(() => {
    const updateWidth = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgWidth(rect.width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Generate grid lines with nice round step values
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const step = getNiceTickStep(max, svgWidth);
    const numSteps = Math.ceil(max / step);

    for (let i = 0; i <= numSteps; i++) {
      const pos = i * step;
      if (pos > max) break;

      // Vertical lines
      lines.push(
        <line key={`v-${i}`} x1={pos} y1={0} x2={pos} y2={max} className={s("gridLine")} />,
      );

      // Horizontal lines
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={max - pos}
          x2={max}
          y2={max - pos}
          className={s("gridLine")}
        />,
      );
    }

    return lines;
  }, [max, s, svgWidth]);

  // Generate axis labels with nice round values to match grid
  const axisLabels = useMemo(() => {
    const labels: JSX.Element[] = [];
    const step = getNiceTickStep(max, svgWidth);
    const numSteps = Math.ceil(max / step);

    // Convert 12px to viewBox units based on actual SVG width
    const viewBoxWidth = max + 2 * (max * 0.1);
    const labelFontSize = (12 / svgWidth) * viewBoxWidth;

    for (let i = 0; i <= numSteps; i++) {
      const pos = i * step;
      if (pos > max) break;

      // Format value nicely - remove unnecessary decimals
      const value = pos.toFixed(3).replace(/\.?0+$/, "");

      // X-axis labels (bottom)
      labels.push(
        <text
          key={`x-${i}`}
          x={pos}
          y={max + labelFontSize * 0.4}
          className={s("axisLabel")}
          dy="1.2em"
          fontSize={labelFontSize}
        >
          {value}
        </text>,
      );

      // Y-axis labels (left)
      labels.push(
        <text
          key={`y-${i}`}
          x={-labelFontSize * 1.7}
          y={max - pos}
          className={s("axisLabel")}
          dy="0.3em"
          textAnchor="end"
          fontSize={labelFontSize}
        >
          {value}
        </text>,
      );
    }

    return labels;
  }, [max, s, svgWidth]);

  // Calculate padding in fixed pixel units, converted to viewBox units
  const viewBoxWidthTemp = max * 1.2; // Initial estimate for calculation
  const labelFontSizeForPadding = (12 / svgWidth) * viewBoxWidthTemp;
  const paddingLeft = labelFontSizeForPadding * 4;
  const paddingBottom = labelFontSizeForPadding * 4;
  const paddingRight = labelFontSizeForPadding * 0;

  const viewBoxWidth = paddingLeft + max + paddingRight;
  const viewBoxHeight = max + paddingBottom;
  const charFontSize = (16 / svgWidth) * viewBoxWidth;
  const charFontSizeHovered = (20 / svgWidth) * viewBoxWidth;

  return (
    <div className={s("container")}>
      <svg
        ref={svgRef}
        className={s("plot")}
        viewBox={`${-paddingLeft} 0 ${viewBoxWidth} ${viewBoxHeight}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid */}
        <g className={s("grid")}>{gridLines}</g>

        {/* Hover line from mouse to closest point */}
        {showHoverLine &&
          hoveredChar &&
          mousePos &&
          (() => {
            const charData = characterData.find((c) => c.char === hoveredChar);
            if (!charData) return null;
            const [x, y] = charData.vector;
            return (
              <line
                x1={mousePos.x}
                y1={max - mousePos.y}
                x2={x}
                y2={max - y}
                className={s("hoverLine")}
              />
            );
          })()}

        {/* Axis labels */}
        <g className={s("axisLabels")}>{axisLabels}</g>

        {/* Axis titles */}
        <text
          x={max / 2}
          y={max + paddingBottom * 0.85}
          className={s("axisTitle")}
          textAnchor="middle"
          fontSize={charFontSize * 0.9}
        >
          Upper
        </text>
        <text
          x={-paddingLeft * 0.95}
          y={max / 2}
          className={s("axisTitle")}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={charFontSize * 0.9}
          transform={`rotate(-90, ${-paddingLeft * 0.95}, ${max / 2})`}
        >
          Lower
        </text>

        {/* Plot border */}
        <rect x={0} y={0} width={max} height={max} className={s("plotBorder")} />

        {/* Character points */}
        <g className={s("points")}>
          {characterData.map((char) => {
            const [x, y] = char.vector; // vector = [upper, lower]
            const isHovered = hoveredChar === char.char;
            const isHighlighted = !hoveredChar && highlightedSet.has(char.char);
            const shouldHighlight = isHovered || isHighlighted;
            const pointRadius = isHovered ? charFontSize * 0.21 : charFontSize * 0.12;

            return (
              <circle
                key={char.char}
                cx={x} // X-axis = upper circle density
                cy={max - y} // Y-axis = lower circle density (SVG y increases downward, matching "lower")
                r={pointRadius}
                className={s("point", { pointHovered: shouldHighlight })}
              />
            );
          })}
        </g>

        {/* Character labels */}
        {(() => {
          // Show hovered character at full opacity
          const hoveredLabel = hoveredChar
            ? (() => {
                const charData = characterData.find((c) => c.char === hoveredChar);
                if (!charData) return null;
                const [x, y] = charData.vector;
                const labelY = max - y - charFontSize * 1.2;

                return (
                  <g key={`label-${hoveredChar}`}>
                    {/* Background rectangle */}
                    <rect
                      x={x - charFontSizeHovered * 0.6}
                      y={labelY - charFontSizeHovered * 0.6}
                      width={charFontSizeHovered * 1.2}
                      height={charFontSizeHovered * 1.2}
                      className={s("characterLabelBackground")}
                      rx={charFontSizeHovered * 0.15}
                    />
                    {/* Character text */}
                    <text
                      x={x}
                      y={labelY}
                      className={s("characterLabel")}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={charFontSizeHovered}
                    >
                      {hoveredChar}
                    </text>
                  </g>
                );
              })()
            : null;

          // Show highlighted characters (faded if hovering something else)
          const highlightedLabels = Array.from(highlightedSet).map((char) => {
            const charData = characterData.find((c) => c.char === char);
            if (!charData) return null;
            const [x, y] = charData.vector;
            const labelY = max - y - charFontSize * 1.2;
            const opacity = hoveredChar ? 0.3 : 1;

            return (
              <g
                key={`label-${char}`}
                opacity={opacity}
                style={{ transition: "opacity 0.2s ease" }}
              >
                {/* Background rectangle */}
                <rect
                  x={x - charFontSizeHovered * 0.6}
                  y={labelY - charFontSizeHovered * 0.6}
                  width={charFontSizeHovered * 1.2}
                  height={charFontSizeHovered * 1.2}
                  className={s("characterLabelBackground")}
                  rx={charFontSizeHovered * 0.15}
                />
                {/* Character text */}
                <text
                  x={x}
                  y={labelY}
                  className={s("characterLabel")}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={charFontSizeHovered}
                >
                  {char}
                </text>
              </g>
            );
          });

          return (
            <>
              {highlightedLabels}
              {hoveredLabel}
            </>
          );
        })()}
      </svg>
    </div>
  );
};
