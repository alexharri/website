import { RunContext } from "./run/RunContext";
import { runScript } from "./run/runScript";
import { scriptedEditorConstants } from "./scriptedEditorConstants";

const { LINE_HEIGHT, V_PADDING } = scriptedEditorConstants;

export const calculateHeight = (lines: number) => {
  return lines * LINE_HEIGHT + V_PADDING * 2;
};

export const startScript = async (runContext: RunContext, index: number, delayMs: number) => {
  runContext.startNewRun();

  const { editor, initialCode } = runContext;
  if (editor.getValue() !== initialCode) {
    editor.setValue(initialCode);
  }

  runScript({ index, delayMs, runContext });
};

export const moveToIndex = async (runContext: RunContext, index: number) => {
  runContext.startNewRun();

  const { editor, initialCode } = runContext;
  if (editor.getValue() !== initialCode) {
    editor.setValue(initialCode);
  }

  const canceled = runContext.getCheckCanceledFunction();

  await runScript({ index, runContext, forceSync: true, onlyRunOneCommand: true });

  if (!canceled()) {
    runContext.cancelCurrentRun();
  }
};
