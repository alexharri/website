import { RunContext } from "./RunContext";

type SelectWordCommand = { command: "Select Word"; word: string; line: number };
export type CustomCommands = SelectWordCommand;

export async function selectWordHandler(runContext: RunContext, command: SelectWordCommand) {
  const { editor, sync } = runContext;
  const { line, word } = command;
  const code = editor.getValue();
  const col = code.split("\n")[line].indexOf(word) + 1;

  const canceled = runContext.getCheckCanceledFunction();

  const startIndex = sync ? word.length : 0;
  for (let i = startIndex; i <= word.length; i++) {
    if (canceled()) return;

    const selection = {
      startLineNumber: line,
      endLineNumber: line,
      startColumn: col,
      endColumn: col + i,
    };
    editor.setSelection(selection);
    if (i < word.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, i === 0 ? 200 : 40));
    }
  }
}

export const customCommandHandlers = {
  selectWordHandler,
};
