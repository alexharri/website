import { customCommandHandlers as customHandlers, CustomCommands } from "./runCustomCommand";
import { RunContext } from "./RunContext";

export const builtInCommands = <const>[
  { command: "Command D", trigger: "editor.action.addSelectionToNextFindMatch" },
  { command: "Insert Line Above", trigger: "editor.action.insertLineBefore" },
  { command: "Tab", trigger: "tab" },

  // Move around
  { command: "Right", trigger: "cursorRight" },
  { command: "Left", trigger: "cursorLeft" },
  { command: "Down", trigger: "cursorDown" },
  { command: "Up", trigger: "cursorUp" },

  // Jump words
  { command: "Option Right", trigger: "cursorWordEndRight" },
  { command: "Option Left", trigger: "cursorWordLeft" },

  // Jump to start or end of line/file
  { command: "Command Right", trigger: "cursorEnd" },
  { command: "Command Left", trigger: "cursorHome" },
  { command: "Command Up", trigger: "cursorTop" },
  { command: "Command Down", trigger: "cursorBottom" },

  // Text selection
  { command: "Shift Right", trigger: "cursorRightSelect" },
  { command: "Shift Left", trigger: "cursorLeftSelect" },
  { command: "Shift Option Right", trigger: "cursorWordEndRightSelect" },
  { command: "Shift Option Left", trigger: "cursorWordLeftSelect" },
  { command: "Shift Command Right", trigger: "cursorEndSelect" },
  { command: "Shift Command Down", trigger: "cursorBottomSelect" },
  { command: "Shift Command Up", trigger: "cursorTopSelect" },
  { command: "Shift Command Left", trigger: "cursorHomeSelect" },

  // Text editing
  { command: "Backspace", trigger: "deleteLeft" },
];

const customCommandHandlers = <const>[
  { command: "Select", handler: customHandlers.selectHandler },
  { command: "Select Word", handler: customHandlers.selectWordHandler },
  { command: "Type", handler: customHandlers.typeHandler },
];

type BuiltInCommand = typeof builtInCommands[number];

const commandToTrigger = {} as Partial<Record<string, BuiltInCommand["trigger"]>>;
for (const { command, trigger } of builtInCommands) {
  commandToTrigger[command] = trigger;
}

export type Command = { command: BuiltInCommand["command"] } | CustomCommands;

export async function runCommand(runContext: RunContext, command: Command) {
  for (const handler of customCommandHandlers) {
    if (handler.command !== command.command) continue;
    await handler.handler(runContext, command);
    return;
  }

  const trigger = commandToTrigger[command.command];
  if (!trigger) {
    console.warn(`Unknown command '${command.command}'`);
    return;
  }
  runContext.editor.trigger(null, trigger, null);
}