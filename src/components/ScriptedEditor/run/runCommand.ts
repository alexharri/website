import { customCommandHandlers as customHandlers, CustomCommands } from "./runCustomCommand";
import { RunContext } from "./RunContext";

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

export type Command = { command: BuiltInCommand["command"] } | CustomCommands;

export async function runCommand(runContext: RunContext, command: Command) {
  for (const handler of customCommandHandlers) {
    if (handler.command !== command.command) continue;
    await handler.handler(runContext, command);
    return;
  }

  const trigger = commandToTrigger[command.command];
  if (!trigger) throw new Error(`Unknown command '${command}'`);
  runContext.editor.trigger(null, trigger, null);
}
