import React from "react";
import { useStyles } from "../../utils/styles";
import { SegmentedControl } from "../SegmentedControl";
import { ViewMode } from "../SplitView";
import ViewModeControlStyles from "./ViewModeControl.styles";

interface ViewModeControlProps {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  setSplitT: (value: number) => void;
  options: Array<{ value: ViewMode; label: string }>;
}

export const ViewModeControl: React.FC<ViewModeControlProps> = ({
  viewMode,
  setViewMode,
  setSplitT,
  options,
}) => {
  const s = useStyles(ViewModeControlStyles);

  return (
    <SegmentedControl
      options={options}
      value={viewMode}
      setValue={(value) => {
        setViewMode(value);
        if (value === "split") {
          setSplitT(0.5);
        }
      }}
    />
  );
};