import { delayMs } from "../../utils/delay";
import { RunContext } from "./run/RunContext";
import { runScript } from "./run/runScript";
import { scriptedEditorConstants } from "./scriptedEditorConstants";

const { LINE_HEIGHT, V_PADDING } = scriptedEditorConstants;

export const calculateHeight = (lines: number) => {
  return lines * LINE_HEIGHT + V_PADDING * 2;
};

interface StartScriptOptions {
  runContext: RunContext;
  index: number;
  delayMs: number;
  loop: boolean;
}

export const startScript = async (options: StartScriptOptions) => {
  await delayMs(1); // Prevent keyboard popupp on iOS

  const { runContext } = options;

  let runAgain = true;
  runContext.startNewRun();
  const canceled = runContext.getCheckCanceledFunction();

  while (runAgain) {
    const { editor, initialCode } = runContext;
    if (editor.getValue() !== initialCode) {
      editor.setValue(initialCode);
    }

    await runScript(options);

    runAgain = options.loop && !canceled();
    if (runAgain) {
      options.index = 0;
      options.delayMs = 1000;
      await delayMs(options.delayMs);
    }
  }
};

export const moveToIndex = async (runContext: RunContext, index: number) => {
  await delayMs(1); // Prevent keyboard popupp on iOS

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
