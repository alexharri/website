import { createProjectSync, ts, Project } from "@ts-morph/bootstrap";
import prettier from "prettier";
import fs from "fs";
import path from "path";

const computeFilePath = path.resolve(process.cwd(), "./src/ts/lib/Compute.ts");
const computeSourceCode = fs.readFileSync(computeFilePath, "utf-8");

async function format(code: string) {
  try {
    const formatted = await prettier.format(code.replaceAll("\n", " "), {
      trailingComma: "all",
      printWidth: 60,
      parser: "typescript",
    });
    return formatted.trim();
  } catch (e) {} // Syntax error, probably
  return code;
}

export function getMetadata(project: Project, i: number, extension: string, sourceCode: string) {
  const fileName = `file${i}.${extension}`;
  project.removeSourceFile(fileName);
  const file = project.createSourceFile(fileName, sourceCode, {
    scriptKind: ts.ScriptKind.TS,
  });
  const service = project.getLanguageService();

  interface Item {
    start: number;
    end: number;
    line: number;
    type: string;
  }

  const items: Item[] = [];

  function dfs(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.Identifier) {
      const info = service.getQuickInfoAtPosition(fileName, node.getStart());
      if (info?.displayParts) {
        const type = ts.displayPartsToString(info.displayParts);
        items.push({
          start: node.getStart(),
          end: node.getEnd(),
          type,
          line: -1,
        });
      }
    }
    ts.forEachChild(node, dfs);
  }
  ts.forEachChild(file, dfs);

  // Cleanup
  project.removeSourceFile(file);

  const indexAtLineArr: number[] = [0];
  for (const [i, line] of sourceCode.split("\n").entries()) {
    indexAtLineArr.push(line.length + 1 + indexAtLineArr[i]);
  }

  for (const item of items) {
    for (let lineIndex = indexAtLineArr.length - 1; lineIndex >= 0; lineIndex--) {
      const indexAtLine = indexAtLineArr[lineIndex];
      if (item.start >= indexAtLine) {
        item.line = lineIndex;
        item.start -= indexAtLine;
        item.end -= indexAtLine;
        break;
      }
    }
  }

  interface TypeInfo {
    lines: Partial<{
      [lineIndex: number]: Array<{
        start: number;
        end: number;
        type: string;
      }>;
    }>;
  }

  const out: TypeInfo = { lines: {} };
  for (const item of items) {
    out.lines[item.line] ??= [];
    out.lines[item.line]!.push(item);
  }
  return out;
}

export async function injectTypeAnnotations(content: string) {
  const project = createProjectSync({
    compilerOptions: {
      strict: true,
      allowJs: true,
      checkJs: true,
    },
  });
  project.createSourceFile("compute.ts", computeSourceCode, {
    scriptKind: ts.ScriptKind.TS,
  });

  const lines = content.split("\n");
  const extensions = new Set(["ts", "js", "tsx", "jsx"]);

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("```")) continue;
    const ext = lines[i].split("```")[1];
    if (!extensions.has(ext)) continue;

    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] !== "```") continue;
      if (j === i + 1) break;

      // Found code block to evaluate
      const code = lines.slice(i + 1, j).join("\n");
      const metadata = getMetadata(project, i, ext, code);
      for (const line of Object.values(metadata.lines)) {
        for (const item of line!) {
          item.type = await format(item.type);
        }
      }
      lines.splice(
        j,
        0,
        `// @type_annotations ${JSON.stringify(metadata).replace("\n", "/newline")}\n`,
      );
      i += j - i;
      break;
    }
  }
  return lines.join("\n");
}
