import { customCommandHandlers as customHandlers, CustomCommands } from "./runCustomCommand";
import { RunContext } from "./RunContext";

export const builtInCommands = <const>[
  // Text selection
  { command: "Command D", trigger: "editor.action.addSelectionToNextFindMatch" },
  { command: "Command K D", trigger: "editor.action.moveSelectionToNextFindMatch" },
  { command: "Shift Command L", trigger: "editor.action.selectHighlights" },

  // Add newline before/after
  { command: "Command Enter", trigger: "editor.action.insertLineAfter" },
  { command: "Shift Command Enter", trigger: "editor.action.insertLineBefore" },

  // Indentation
  { command: "Tab", trigger: "tab" },
  { command: "Shift Tab", trigger: "outdent" },

  // Arrow keys - movement
  { command: "Right", trigger: "cursorRight" },
  { command: "Left", trigger: "cursorLeft" },
  { command: "Down", trigger: "cursorDown" },
  { command: "Up", trigger: "cursorUp" },
  { command: "Option Right", trigger: "cursorWordEndRight" },
  { command: "Option Left", trigger: "cursorWordLeft" },
  { command: "Command Right", trigger: "cursorEnd" },
  { command: "Command Left", trigger: "cursorHome" },
  { command: "Command Up", trigger: "cursorTop" },
  { command: "Command Down", trigger: "cursorBottom" },

  // Arrow keys - selection
  { command: "Shift Right", trigger: "cursorRightSelect" },
  { command: "Shift Left", trigger: "cursorLeftSelect" },
  { command: "Shift Up", trigger: "cursorUpSelect" },
  { command: "Shift Down", trigger: "cursorDownSelect" },
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
  { command: "Wrap", handler: customHandlers.wrapHandler },
  { command: "Copy", handler: customHandlers.copyHandler },
  { command: "Paste", handler: customHandlers.pasteHandler },
  { command: "Enter", handler: customHandlers.enterHandler },
  { command: "Exec", handler: customHandlers.execHandler },
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
    await handler.handler(runContext, command as any);
    return;
  }

  const trigger = commandToTrigger[command.command];
  if (!trigger) {
    console.warn(`Unknown command '${command.command}'`);
    return;
  }
  runContext.editor.trigger(null, trigger, null);
}
