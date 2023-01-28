import { delayMs } from "../../../utils/delay";
import { MonacoEditor } from "../types/scriptedEditorTypes";
import { ScriptCommand } from "../types/scriptTypes";

type OnRunCommand = (index: number, time: number) => void;
type OnPlaying = (playing: boolean) => void;

interface Options {
  editor: MonacoEditor;
  script: ScriptCommand[];
  scriptId: string;
  initialCode: string;
  renderExecElement: (text: string) => HTMLElement;
}

export class RunContext {
  scrolledAt = 0;
  clipboard: string[] = [""];
  runId = 0;
  initialCode: string;
  editor: MonacoEditor;
  script: ScriptCommand[];
  scriptId: string;
  sync = true;
  index = 0;
  execEl: HTMLElement | null = null;
  renderExecElement: Options["renderExecElement"];
  decorationIds: string[] = [];
  private moveIndexHandlers: OnRunCommand[] = [];
  private playingHandlers: OnPlaying[] = [];

  constructor(options: Options) {
    this.editor = options.editor;
    this.script = options.script;
    this.initialCode = options.initialCode;
    this.scriptId = options.scriptId;
    this.renderExecElement = options.renderExecElement;
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

  createExecElement(text: string) {
    return this.renderExecElement(">" + text);
  }

  updateExecElement(el: HTMLElement, text: string) {
    const textElement = el.querySelector(`[data-text-element]`)! as HTMLElement;
    textElement.innerText = ">" + text;
  }

  clearExecElement(el: HTMLElement | null) {
    el?.parentNode?.removeChild(el);
  }

  async waitIdle() {
    const canceled = this.getCheckCanceledFunction();
    const waitAfterScroll = 750;

    const getDist = () => this.scrolledAt + waitAfterScroll - Date.now();

    let dist = getDist();
    if (dist < 0) return;

    while (true) {
      if (dist < 0) {
        if (!canceled() && false) this.editor.focus();
        return;
      }

      await delayMs(dist);
      dist = getDist();
    }
  }

  clearDecorations() {
    const { editor } = this;
    this.decorationIds = editor.deltaDecorations(this.decorationIds, []);
  }

  updateDecorations() {
    const { editor } = this;
    const selections = editor.getSelections() || [];

    const lines = editor.getValue().split("\n");

    this.decorationIds = editor.deltaDecorations(this.decorationIds, [
      ...selections.map((sel) => ({
        options: {
          className: ["selection-cursor", "rand-" + Math.floor(Math.random() * 1000000)].join(" "),
        },
        range: {
          startColumn: sel.positionColumn,
          endColumn: sel.positionColumn,
          startLineNumber: sel.positionLineNumber,
          endLineNumber: sel.positionLineNumber,
        },
      })),
      ...selections
        .filter((sel) => {
          if (sel.startColumn === sel.endColumn && sel.startLineNumber === sel.endLineNumber) {
            return false;
          }
          return true;
        })
        .map((sel) => {
          const out = [];

          for (let i = sel.startLineNumber; i <= sel.endLineNumber; i++) {
            const line = lines[i - 1];
            out.push({
              options: {
                className: i === sel.endLineNumber ? "selection-bg" : "selection-bg newline",
              },
              range: {
                startColumn: i === sel.startLineNumber ? sel.startColumn : 1,
                endColumn: i === sel.endLineNumber ? sel.endColumn : line.length + 2,
                startLineNumber: i,
                endLineNumber: i,
              },
            });
          }

          return out;
        })
        .flat(),
    ]);
  }
}
