import { customCommandHandlers as customHandlers, CustomCommands } from "./runCustomCommand";
import { MonacoEditor } from "./scriptedEditorTypes";

export const builtInCommands = <const>[
  { command: "Command D", trigger: "editor.action.addSelectionToNextFindMatch" },

  // Text selection
  { command: "Right", trigger: "cursorRight" },
  { command: "Left", trigger: "cursorLeft" },
  { command: "Shift Right", trigger: "cursorRightSelect" },
  { command: "Shift Left", trigger: "cursorLeftSelect" },
  { command: "Option Right", trigger: "cursorWordEndRight" },
  { command: "Option Left", trigger: "cursorWordLeft" },
  { command: "Shift Option Right", trigger: "cursorWordEndRightSelect" },
  { command: "Shift Option Left", trigger: "cursorWordLeftSelect" },
  { command: "Command Right", trigger: "cursorEnd" },
  { command: "Command Left", trigger: "cursorHome" },
  { command: "Shift Command Right", trigger: "cursorEndSelect" },
  { command: "Shift Command Left", trigger: "cursorHomeSelect" },
];

const customCommandHandlers = <const>[
  { command: "Select Word", handler: customHandlers.selectWordHandler },
];

type BuiltInCommand = typeof builtInCommands[number];

const commandToTrigger = {} as Partial<Record<string, BuiltInCommand["trigger"]>>;
for (const { command, trigger } of builtInCommands) {
  commandToTrigger[command] = trigger;
}

export type Command =
  | BuiltInCommand["command"]
  | { command: BuiltInCommand["command"] }
  | CustomCommands;

export function runCommand(editor: MonacoEditor, command: Command) {
  if (typeof command !== "string") {
    for (const handler of customCommandHandlers) {
      if (handler.command !== command.command) continue;
      handler.handler(editor, command);
      return;
    }
  }

  if (typeof command !== "string") {
    command = command.command as BuiltInCommand["command"];
  }

  const trigger = commandToTrigger[command];
  if (!trigger) throw new Error(`Unknown command '${command}'`);
  editor.trigger(null, trigger, null);
}
