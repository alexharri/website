import { runCommand } from "./runCommand";
import { MonacoEditor } from "./scriptedEditorTypes";
import { ScriptCommand } from "./scriptTypes";

export async function runScript(
  index: number,
  delay: number,
  editor: MonacoEditor,
  script: ScriptCommand[],
  canceled: () => boolean,
) {
  editor.focus();

  const execSync = script.slice(0, index);
  const execTimed = script.slice(index);

  for (const command of execSync) {
    runCommand(editor, command);
  }

  await new Promise<void>((resolve) => setTimeout(resolve, delay));

  for (const command of execTimed) {
    if (canceled()) return;

    const { times = 1, msBetween = 128 } = command;
    if (!Number.isFinite(times)) throw new Error(`Unexpected times value ${times}`);

    for (let i = 0; i < times; i++) {
      runCommand(editor, command);
      if (i < times - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, msBetween));
      }
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }
}
