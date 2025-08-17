import React, { useState } from "react";
import { useStyles } from "../../utils/styles";
import { clamp } from "../../math/math";
import SplitViewStyles from "./SplitView.styles";
import { colors } from "../../utils/cssVariables";
import { hexToRgbaString } from "../../utils/color";

export type ViewMode = "left" | "split" | "right" | "transparent";

interface SplitViewProps {
  children: [React.ReactNode, React.ReactNode];
  height: number;
  width: number;
  viewMode: ViewMode;
  splitPosition?: number;
  onSplitPositionChange?: (position: number) => void;
  wrapperRef?: React.RefObject<HTMLDivElement>;
}

export const SplitView: React.FC<SplitViewProps> = ({
  children,
  height,
  width,
  viewMode,
  splitPosition = 0.5,
  onSplitPositionChange,
  wrapperRef,
}) => {
  const s = useStyles(SplitViewStyles);
  const [isDragging, setIsDragging] = useState(false);
  const [leftContent, rightContent] = children;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === "split") {
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === "split") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newPosition = clamp(x / rect.width, 0.2, 0.8);
      onSplitPositionChange?.(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const splitPercentage = splitPosition * 100;

  return (
    <div
      className={s("wrapper")}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: "grab" }}
    >
      <div
        className={s("divider", { dragging: isDragging, split: viewMode === "split" })}
        style={{
          transform:
            viewMode === "split"
              ? `translateX(calc(${splitPosition * width}px - ${width / 2}px - 50%))`
              : viewMode === "right"
              ? `translateX(calc(-${width / 2}px - 100%))`
              : `translateX(${width / 2}px)`,
          transition: isDragging ? "none" : "all 0.5s",
        }}
        onMouseDown={handleMouseDown}
      >
        <div data-handle />
      </div>

      <div ref={wrapperRef}>
        <div
          className={s("leftPanel")}
          style={{
            transform:
              viewMode === "split"
                ? `translateX(calc(-${width * (1 - splitPosition)}px))`
                : viewMode === "left" || viewMode === "transparent"
                ? "translateX(0)"
                : "translateX(-100%)",
            transition: isDragging ? "none" : "all 0.5s",
            background:
              viewMode === "transparent"
                ? hexToRgbaString(colors.background200, 0.5)
                : colors.background200,
          }}
        >
          <div
            className={s("leftPanelInner")}
            style={{
              transform:
                viewMode === "split"
                  ? `translateX(calc(${-splitPercentage / 2}% + 50%))`
                  : viewMode === "left" || viewMode === "transparent"
                  ? "translateX(0)"
                  : "translateX(100%)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            {leftContent}
          </div>
        </div>

        <div
          className={s("rightPanel", { split: viewMode === "split" })}
          style={{
            height,
            transform:
              viewMode === "split" ? `translateX(${width * splitPosition}px)` : "translateX(0)",
            transition: isDragging ? "none" : "all 0.5s",
          }}
        >
          <div
            className={s("rightPanelInner", { split: viewMode === "split" })}
            style={{
              transform:
                viewMode === "split"
                  ? `translateX(calc(-${50 + (splitPosition * 100) / 2}%))`
                  : "translateX(-50%)",
              transition: isDragging ? "none" : "all 0.5s",
            }}
          >
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
};
