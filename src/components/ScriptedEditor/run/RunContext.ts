import { MonacoEditor } from "../types/scriptedEditorTypes";
import { ScriptCommand } from "../types/scriptTypes";

type OnRunCommand = (index: number, time: number) => void;
type OnPlaying = (playing: boolean) => void;

export class RunContext {
  runId = 0;
  editor: MonacoEditor;
  script: ScriptCommand[];
  sync = true;
  index = 0;
  private moveIndexHandlers: OnRunCommand[] = [];
  private playingHandlers: OnPlaying[] = [];

  constructor(editor: MonacoEditor, script: ScriptCommand[]) {
    this.editor = editor;
    this.script = script;
  }

  subscribe(type: "playing", handler: OnPlaying): void;
  subscribe(type: "run-command", handler: OnRunCommand): void;
  subscribe(type: "playing" | "run-command", handler: OnPlaying | OnRunCommand): void {
    if (type === "run-command") {
      this.moveIndexHandlers.push(handler as OnRunCommand);
      return;
    }
    if (type === "playing") {
      this.playingHandlers.push(handler as OnPlaying);
      return;
    }
  }

  unsubscribe(type: "run-command" | "playing", handler: OnRunCommand | OnPlaying): void {
    if (type === "run-command") {
      const i = this.moveIndexHandlers.indexOf(handler as OnRunCommand);
      if (i === -1) return;
      this.moveIndexHandlers.splice(i, 1);
      return;
    }
    if (type === "playing") {
      const i = this.playingHandlers.indexOf(handler as OnPlaying);
      if (i === -1) return;
      this.playingHandlers.splice(i, 1);
      return;
    }
  }

  emit(type: "run-command", data: { index: number; time: number }): void;
  emit(type: "playing", data: { playing: boolean }): void;
  emit(
    type: "run-command" | "playing",
    data: { index: number; time: number } | { playing: boolean },
  ) {
    if (type === "run-command") {
      const { index, time } = data as { index: number; time: number };
      this.index = index;
      this.moveIndexHandlers.forEach((handler) => handler(index, time));
      return;
    }
    if (type === "playing") {
      const { playing } = data as { playing: boolean };
      this.playingHandlers.forEach((handler) => handler(playing));
      return;
    }
  }

  getCheckCanceledFunction() {
    const runId = this.runId;
    return () => this.runId !== runId;
  }

  cancelCurrentRun() {
    this.playingHandlers.forEach((fn) => fn(false));
    this.runId++;
  }

  /**
   * Also cancels the current run if there is a current run in process.
   */
  startNewRun() {
    this.playingHandlers.forEach((fn) => fn(true));
    this.runId++;
  }
}
