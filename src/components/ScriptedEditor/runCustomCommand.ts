import { MonacoEditor } from "./scriptedEditorTypes";

type SelectWordCommand = { command: "Select Word"; word: string; line: number };
export type CustomCommands = SelectWordCommand;

export function selectWordHandler(editor: MonacoEditor, command: SelectWordCommand) {
  const { line, word } = command;
  const code = editor.getValue();
  const col = code.split("\n")[line].indexOf(word) + 1;
  const selection = {
    startLineNumber: line,
    endLineNumber: line,
    startColumn: col,
    endColumn: col + word.length,
  };
  editor.setSelection(selection);
}

export const customCommandHandlers = {
  selectWordHandler,
};
