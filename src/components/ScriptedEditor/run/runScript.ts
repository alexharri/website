import { runCommand } from "./runCommand";
import { RunContext } from "./RunContext";

export async function runScript(index: number, delay: number, runContext: RunContext) {
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
  runContext.sync = false;

  const time = script[index - 1]?.times ?? 1;
  runContext.emit("run-command", { index: index - 1, time });

  await new Promise<void>((resolve) => setTimeout(resolve, delay));

  for (let commandIndex = index; commandIndex < script.length; commandIndex++) {
    const command = script[commandIndex];
    if (canceled()) return;

    const { times = 1, msBetween = 128 } = command;
    if (!Number.isFinite(times)) throw new Error(`Unexpected times value ${times}`);

    for (let i = 0; i < times; i++) {
      await runCommand(runContext, command);
      runContext.emit("run-command", { index: commandIndex, time: i + 1 });
      if (i < times - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, msBetween));
      }
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }
}
