import { runCommand } from "./runCommand";
import { MonacoEditor } from "./scriptedEditorTypes";
import { ScriptCommand } from "./scriptTypes";

export async function runScript(
  editor: MonacoEditor,
  script: ScriptCommand[],
  canceled: () => boolean,
) {
  editor.focus();

  for (const command of script) {
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
