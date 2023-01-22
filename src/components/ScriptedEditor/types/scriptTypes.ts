import { Command } from "../run/runCommand";

export type ScriptCommand = Command & {
  times?: number;
  msBetween?: number;
  sync?: boolean;
  msAfter?: number;
};
