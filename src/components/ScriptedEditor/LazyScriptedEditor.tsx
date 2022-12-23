import { useEffect, useRef, useState } from "react";
import { ScriptedEditor, ScriptedEditorProps } from "./ScriptedEditor";

export function LazyScriptedEditor<T>(props: Omit<ScriptedEditorProps, "setHeight">) {
  const [render, setRender] = useState(true);
  const [height, setHeight] = useState(props.expectedHeight ?? 128);
  const renderRef = useRef(render);
  renderRef.current = render;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("observing");

    const el = ref.current!;
    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (!entry) {
        console.warn("Received 0 entries from IntersectionObserver");
        return;
      }
      if (renderRef.current === entry.isIntersecting) return;
      setRender(entry.isIntersecting);
      console.log(props.scriptId, entry.isIntersecting);
    };
    const observer = new IntersectionObserver(callback, {
      root: document,
      rootMargin: "64px",
    });
    observer.observe(el);

    return () => observer.unobserve(el);
  }, []);

  return (
    <div style={{ height: height + 128 }} ref={ref}>
      {render && <ScriptedEditor {...props} setHeight={setHeight} />}
    </div>
  );
}
