import { scriptedEditorConstants } from "./scriptedEditorConstants";

const { LINE_HEIGHT, V_PADDING } = scriptedEditorConstants;

export const calculateHeight = (lines: number) => {
  return lines * LINE_HEIGHT + V_PADDING * 2;
};
