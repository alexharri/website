import { delayMs } from "../../../utils/delay";
import { RunContext } from "./RunContext";

type SelectCommand = { command: "Select"; line: number; col: number; length?: number };
type SelectWordCommand = { command: "Select Word"; word: string; line: number };
type TypeCommand = { command: "Type"; text: string };
type EnterCommand = { command: "Enter"; indent: number };
type CopyCommand = { command: "Copy" };
type PasteCommand = { command: "Paste" };
type ExecCommand = { command: "Exec"; label: string; trigger: string };
type WrapCommand = { command: "Wrap"; text: string };
export type CustomCommands =
  | SelectWordCommand
  | SelectWordCommand
  | TypeCommand
  | EnterCommand
  | CopyCommand
  | PasteCommand
  | ExecCommand
  | WrapCommand;

async function selectHandler(runContext: RunContext, command: SelectCommand) {
  const { editor, sync } = runContext;
  const { line, col, length = 0 } = command;

  const canceled = runContext.getCheckCanceledFunction();

  const startIndex = sync ? length : 0;
  for (let i = startIndex; i <= length; i++) {
    if (!sync) await runContext.waitIdle();
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

async function selectWordHandler(runContext: RunContext, command: SelectWordCommand) {
  const { editor } = runContext;
  const { line, word } = command;
  const code = editor.getValue();

  const lines = code.split("\n");
  const lineAtIndex = lines[line - 1];

  if (!lineAtIndex) {
    console.warn(`Failed to get line number ${line}. Code only has ${lines.length} lines.`);
    return;
  }

  const index = lineAtIndex.indexOf(word);
  const col = index + 1;

  return selectHandler(runContext, {
    command: "Select",
    col,
    line,
    length: word.length,
  });
}

async function pasteHandler(runContext: RunContext, _command: PasteCommand) {
  const { editor, clipboard } = runContext;
  const selections = editor.getSelections() || [];
  if (selections.length === clipboard.length) {
    editor.executeEdits(
      null,
      selections.map((range, i) => ({ range, text: clipboard[i], forceMoveMarkers: true })),
    );
  } else {
    const text = clipboard.join("\n");
    editor.executeEdits(
      null,
      selections.map((range, i) => ({ range, text, forceMoveMarkers: true })),
    );
  }
}

async function copyHandler(runContext: RunContext, _command: CopyCommand) {
  const { editor } = runContext;
  const value = editor.getValue();
  const lines = value.split("\n");
  runContext.clipboard = (editor.getSelections() ?? []).map((selection) => {
    if (selection.startLineNumber !== selection.endLineNumber) {
      console.warn("Multi-line copying has not been implemented.");
      return "";
    }
    return lines[selection.startLineNumber - 1].substring(
      selection.startColumn - 1,
      selection.endColumn - 1,
    );
  });
}

async function typeHandler(runContext: RunContext, command: TypeCommand) {
  const { editor, sync } = runContext;
  const { text } = command;

  if (typeof text !== "string") {
    console.warn("No text provided to Type command", command);
    return;
  }

  const canceled = runContext.getCheckCanceledFunction();

  const startIndex = sync ? text.length : 0;
  for (let i = startIndex; i <= text.length; i++) {
    if (!sync) await runContext.waitIdle();
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

function enterHandler(runContext: RunContext, command: EnterCommand) {
  const { editor } = runContext;
  const selections = editor.getSelections() || [];

  if (selections.length !== 1) {
    console.warn(`Expected number of selections to be 1`);
    return;
  }
  const indent = Array.from({ length: command.indent ?? 0 })
    .fill("  ")
    .join("");
  editor.trigger(null, "type", { text: `\n${indent}\n` });
  editor.setSelections([
    {
      positionColumn: indent.length + 1,
      selectionStartColumn: indent.length + 1,
      positionLineNumber: selections[0].startLineNumber + 1,
      selectionStartLineNumber: selections[0].startLineNumber + 1,
    },
  ]);
}

async function execHandler(runContext: RunContext, command: ExecCommand) {
  const canceled = runContext.getCheckCanceledFunction();
  let execElement: HTMLElement | null = null;

  if (!runContext.sync) {
    execElement = runContext.createExecElement("");
    await delayMs(700);

    for (let i = 0; i < command.label.length; i++) {
      await runContext.waitIdle();
      if (canceled()) {
        runContext.clearExecElement(execElement!);
        return;
      }

      const text = command.label.substring(0, i + 1);
      runContext.updateExecElement(execElement, text);

      await delayMs(50);
    }

    await delayMs(600);
  }
  runContext.clearExecElement(execElement!);
  runContext.editor.trigger(null, command.trigger, {});
}

async function wrapHandler(runContext: RunContext, command: WrapCommand) {
  const { editor } = runContext;
  const { text } = command;
  const selections = editor.getSelections() || [];

  function createRange(col: number, line: number) {
    return { endColumn: col, startColumn: col, endLineNumber: line, startLineNumber: line };
  }
  editor.executeEdits(
    null,
    selections
      .map((range) => {
        const { startColumn, endColumn, startLineNumber, endLineNumber } = range;
        const left = text[0];
        const right = text.length > 1 ? text[1] : text;
        return [
          { range: createRange(endColumn, endLineNumber), text: left },
          { range: createRange(startColumn, startLineNumber), text: right },
        ];
      })
      .flat(),
  );
  editor.setSelections(
    selections.map((sel) => {
      return {
        positionColumn: sel.endColumn + 1,
        positionLineNumber: sel.endLineNumber,
        selectionStartColumn: sel.startColumn + 1,
        selectionStartLineNumber: sel.startLineNumber,
      };
    }),
  );
}

export const customCommandHandlers = {
  selectHandler,
  selectWordHandler,
  typeHandler,
  pasteHandler,
  copyHandler,
  enterHandler,
  execHandler,
  wrapHandler,
};
