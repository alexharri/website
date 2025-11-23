import { useContext, useEffect, useRef, useState } from "react";
import { RunContext } from "./run/RunContext";
import { __ScriptedEditor } from "./ScriptedEditor";
import { ScriptedEditorControls } from "./ScriptedEditorControls";
import { MonacoContext } from "./MonacoProvider";
import { useStyles } from "../../utils/styles";
import { LazyScriptedEditorStyles } from "./LazyScriptedEditor.styles";

interface Props {
  language: string | undefined;
  initialCode: string;
  scriptId: string;
  expectedMaxLines: number;
  loop: boolean;
}

function LazyScriptedEditor(props: Props) {
  const s = useStyles(LazyScriptedEditorStyles);

  const { expectedMaxLines, scriptId } = props;

  const { ready, requestLoad } = useContext(MonacoContext);
  const [runContext, setRunContext] = useState<RunContext | null>(null);
  const [render, setRender] = useState(true);
  const [lines, setLines] = useState(expectedMaxLines);

  useEffect(() => {
    requestLoad();
  }, []);

  const onMaxLinesCalculated = (lines: number) => {
    if (lines !== expectedMaxLines) {
      console.warn(
        `Expected lines did not match for ${scriptId}.\n` +
          `\tExpected ${expectedMaxLines} but got ${lines}`,
      );
      setLines(lines);
    }
  };

  const ref = useRef<HTMLDivElement>(null);
  const renderRef = useRef(render);
  renderRef.current = render;

  useEffect(() => {
    if (!expectedMaxLines) {
      console.warn(`No expected number of lines for script ${scriptId}`);
    }
  }, []);

  useEffect(() => {
    const el = ref.current!;
    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (!entry) {
        console.warn("Received 0 entries from IntersectionObserver");
        return;
      }
      if (renderRef.current === entry.isIntersecting) return;
      setRender(entry.isIntersecting);
    };
    const observer = new IntersectionObserver(callback, {
      root: document,
      rootMargin: "64px",
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div className="pre">
      <div
        ref={ref}
        className={[s("outerWrapper")].join(" ")}
        data-scripted-editor={props.scriptId}
      >
        <div className={s("lineWrapper")}>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={s("line")} />
          ))}
        </div>
        {render && ready ? (
          <div className={s("editorWrapper")}>
            <__ScriptedEditor
              {...props}
              onMaxLinesCalculated={onMaxLinesCalculated}
              setRunContext={setRunContext}
              language={props.language}
              loop={props.loop}
            />
          </div>
        ) : (
          <div className={s("placeholder")}>Loading editor...</div>
        )}
      </div>
      <ScriptedEditorControls
        initialCode={props.initialCode}
        scriptId={props.scriptId}
        runContext={runContext}
        loop={props.loop}
      />
    </div>
  );
}

export function withScriptedEditor<T extends { children: any }>(
  Component: React.ComponentType<T>,
  getProps: (props: T) => { code: string; language: string | undefined },
) {
  return (props: T) => {
    const { code, language } = getProps(props);
    const searchStr = "// @script ";

    const allLines = code.split("\n");

    const lines = allLines.filter((line) => !line.startsWith(searchStr));
    const scriptLine = allLines.find((line) => line.startsWith(searchStr));

    if (!scriptLine) {
      return <Component {...props} />;
    }

    while (lines[0] === "") {
      lines.shift();
    }
    while (lines[lines.length - 1] === "") {
      lines.pop();
    }
    const initialCode = lines.join("\n");
    const [scriptId, ...rest] = scriptLine.split(searchStr)[1].trim().split(" ");

    const expectedLinesStr = rest.find((item) => item.startsWith("expectedLines=")) ?? "";
    const expectedLines = expectedLinesStr.split("expectedLines=")[1];

    const loop = !!rest.find((item) => item === "loop");

    return (
      <LazyScriptedEditor
        initialCode={initialCode}
        language={language}
        scriptId={scriptId}
        expectedMaxLines={expectedLines ? Number(expectedLines) : lines.length}
        loop={loop}
      />
    );
  };
}
