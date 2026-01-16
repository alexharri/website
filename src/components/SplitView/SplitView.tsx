import React, { useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import { clamp } from "../../math/math";
import SplitViewStyles from "./SplitView.styles";

export type ViewMode = "left" | "split" | "right" | "transparent";

interface SplitViewProps {
  children: [React.ReactNode, React.ReactNode];
  height: number;
  width: number;
  viewMode: ViewMode;
  splitPosition?: number;
  onSplitPositionChange?: (position: number) => void;
  wrapperRef?: React.RefObject<HTMLDivElement>;
  splitMode?: "static" | "dynamic";
  draggable?: boolean;
}

export const SplitView: React.FC<SplitViewProps> = ({
  children,
  height,
  width,
  viewMode,
  splitPosition = 0.5,
  onSplitPositionChange,
  wrapperRef,
  splitMode = "static",
  draggable,
}) => {
  const s = useStyles(SplitViewStyles);
  const rectRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [leftContent, rightContent] = children;

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (viewMode !== "split") {
      return;
    }
    setIsDragging(true);

    const getClientX = (e: MouseEvent | TouchEvent): number => {
      return "touches" in e ? e.touches[0].clientX : e.clientX;
    };

    function onMove(e: MouseEvent | TouchEvent) {
      if (!rectRef?.current) return;
      e.preventDefault();
      const rect = rectRef.current.getBoundingClientRect();
      const x = getClientX(e) - rect.left;
      const newPosition = clamp(x / rect.width, 0.1, 0.9);
      onSplitPositionChange?.(newPosition);
    }

    function onEnd() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      setIsDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  const splitPercentage = splitPosition * 100;

  const [down, setDown] = useState(false);

  return (
    <div
      className={s("wrapper")}
      style={{ cursor: draggable ? (down ? "grabbing" : "grab") : "initial" }}
      ref={rectRef}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
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
          transition: isDragging ? "none" : "transform 0.5s",
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div data-handle />
      </div>

      <div ref={wrapperRef}>
        <div
          className={s("leftPanel")}
          style={{
            transform:
              viewMode === "split"
                ? splitMode === "dynamic"
                  ? `translateX(calc(-${width * (1 - splitPosition)}px))`
                  : `translateX(calc(-${width * (1 - splitPosition)}px))`
                : viewMode === "left" || viewMode === "transparent"
                ? "translateX(0)"
                : "translateX(-100%)",
            transition: isDragging ? "none" : "transform 0.5s",
          }}
        >
          <div
            className={s("leftPanelInner")}
            style={{
              transform:
                viewMode === "split"
                  ? splitMode === "dynamic"
                    ? `translateX(calc(${-splitPercentage / 2}% + 50%))`
                    : `translateX(calc(-${splitPercentage}% + 100%))`
                  : viewMode === "left" || viewMode === "transparent"
                  ? "translateX(0)"
                  : "translateX(100%)",
              transition: isDragging ? "none" : "transform 0.5s",
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
              viewMode === "split"
                ? splitMode === "dynamic"
                  ? `translateX(${width * splitPosition}px)`
                  : "translateX(0)"
                : "translateX(0)",
            transition: isDragging ? "none" : "transform 0.5s",
          }}
        >
          <div
            className={s("rightPanelInner", { split: viewMode === "split" })}
            style={{
              transform:
                viewMode === "split"
                  ? splitMode === "dynamic"
                    ? `translateX(calc(-${50 + (splitPosition * 100) / 2}%))`
                    : "translateX(-50%)"
                  : "translateX(-50%)",
              transition: isDragging ? "none" : "transform 0.5s",
            }}
          >
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
};
