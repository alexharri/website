import Head from "next/head";
import { Link } from "./components/Link";
import { withScriptedEditor } from "./components/ScriptedEditor/LazyScriptedEditor";
import { SmallNote } from "./components/SmallNote/SmallNote";
import { Pre, StaticCodeBlock } from "./components/StaticCodeBlock/StaticCodeBlock";
import { RenderTextCommand } from "./components/ScriptedEditor/RenderCommand/RenderCommand";
import { NotMacOs } from "./components/OperatingSystem/OperatingSystem";
import { Image } from "./components/Image";
import { SectionAnchor } from "./components/SectionAnchor/SectionAnchor";
import { Note } from "./components/Note/Note";
import { Scene } from "./threejs/scenes";
import { BarChart } from "./components/BarChart/BarChart";

export const components = {
  a: Link,
  pre: withScriptedEditor(Pre, (props) => {
    const language = props.children.props.className?.split("-")[1] ?? "text";
    return { code: props.children.props.children, language };
  }),
  img: Image,
  Image,
  StaticCodeBlock: withScriptedEditor(StaticCodeBlock, (props) => ({
    code: props.children,
    language: props.language,
  })),
  SmallNote,
  CodeScript: (props: any) => (
    <div
      data-script-id={props.id}
      data-script={JSON.stringify(props.script)}
      data-expected-lines={props.expectedLines}
    />
  ),
  Command: RenderTextCommand,
  SectionAnchor,
  NotMacOs,
  Head,
  Note,
  Scene,
  BarChart,
};
