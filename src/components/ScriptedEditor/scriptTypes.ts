import { Command } from "./runCommand";

export type ScriptCommand = Command & { times?: number; msBetween?: number };
