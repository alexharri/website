import { RunContext } from "./RunContext";

type SelectCommand = { command: "Select"; line: number; col: number; length?: number };
type SelectWordCommand = { command: "Select Word"; word: string; line: number };
type TypeCommand = { command: "Type"; text: string };
export type CustomCommands = SelectWordCommand;

export async function selectHandler(runContext: RunContext, command: SelectCommand) {
  const { editor, sync } = runContext;
  const { line, col, length = 0 } = command;

  const canceled = runContext.getCheckCanceledFunction();

  const startIndex = sync ? length : 0;
  for (let i = startIndex; i <= length; i++) {
    if (canceled()) return;

    const selection = {
      startLineNumber: line,
      endLineNumber: line,
      startColumn: col,
      endColumn: col + i,
    };
    editor.setSelection(selection);
    if (i < length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, i === 0 ? 200 : 40));
    }
  }
}

export async function selectWordHandler(runContext: RunContext, command: SelectWordCommand) {
  const { editor } = runContext;
  const { line, word } = command;
  const code = editor.getValue();

  const lineAtIndex = code.split("\n")[line - 1];
  const index = lineAtIndex.indexOf(word);
  const col = index + 1;

  return selectHandler(runContext, {
    command: "Select",
    col,
    line,
    length: word.length,
  });
}

export async function typeHandler(runContext: RunContext, command: TypeCommand) {
  const { editor, sync } = runContext;
  const { text } = command;

  const canceled = runContext.getCheckCanceledFunction();

  const startIndex = sync ? text.length : 0;
  for (let i = startIndex; i <= text.length; i++) {
    if (canceled()) return;
    const selections = editor.getSelections() || [];
    const toInsert = sync ? text : text[i];
    editor.executeEdits(
      null,
      selections.map((range) => ({ range, text: toInsert, forceMoveMarkers: true })),
    );
    if (i < text.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, i === 0 ? 200 : 80));
    }
  }
}

export const customCommandHandlers = {
  selectHandler,
  selectWordHandler,
  typeHandler,
};
