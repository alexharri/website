import { delayMs } from "../../../utils/delay";
import { runCommand } from "./runCommand";
import { RunContext } from "./RunContext";

interface Options {
  index: number;
  runContext: RunContext;
  delayMs?: number;
  forceSync?: boolean;
  onEachStep?: () => void;
}

export async function runScript(options: Options) {
  const { runContext, index } = options;

  const { editor, script } = runContext;
  editor.focus();
  editor.setSelection({ startColumn: 1, endColumn: 1, startLineNumber: 1, endLineNumber: 1 });

  const canceled = runContext.getCheckCanceledFunction();

  runContext.sync = true;
  for (const command of script.slice(0, index)) {
    const { times = 1 } = command;
    for (let i = 0; i < times; i++) {
      runCommand(runContext, command);
    }
  }

  const time = script[index - 1]?.times ?? 1;
  runContext.emit("run-command", { index: index - 1, time });

  if (options.delayMs) await delayMs(options.delayMs);

  for (let commandIndex = index; commandIndex < script.length; commandIndex++) {
    const command = script[commandIndex];
    if (canceled()) return;

    runContext.sync = command.sync ?? false;
    if (options.forceSync) runContext.sync = true;

    const { times = 1, msBetween = 128 } = command;
    if (!Number.isFinite(times)) throw new Error(`Unexpected times value ${times}`);

    for (let i = 0; i < times; i++) {
      runContext.emit("run-command", { index: commandIndex, time: i + 1 });
      await runCommand(runContext, command);
      options.onEachStep?.();

      if (i < times - 1) {
        if (!options.forceSync) await delayMs(msBetween);
      }
    }

    if (!options.forceSync) await delayMs(command.msAfter ?? 500);
  }

  runContext.emit("playing", { playing: false });
}
