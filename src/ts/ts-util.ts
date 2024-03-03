import { createProjectSync, ts, Project } from "@ts-morph/bootstrap";
import fs from "fs";
import path from "path";

const computeFilePath = path.resolve(process.cwd(), "./src/ts/lib/Compute.ts");
const computeSourceCode = fs.readFileSync(computeFilePath, "utf-8");

export function getMetadata(
  project: Project,
  i: number,
  extension: string,
  sourceCode: string,
): any {
  const fileName = `file${i}.${extension}`;
  const file = project.createSourceFile(fileName, sourceCode, {
    scriptKind: ts.ScriptKind.TS,
  });
  const service = project.getLanguageService();

  const program = project.createProgram();
  const typeChecker = program.getTypeChecker();

  interface Item {
    start: number;
    end: number;
    line: number;
    prefix: string;
    type: string;
  }

  const items: Item[] = [];

  function dfs(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.Identifier) {
      const type = typeChecker.getTypeAtLocation(node);

      let prefix: string = "";
      let typeStr: string;
      let isInterface = false;

      const impls = service.getImplementationAtPosition(fileName, node.getStart());
      const impl = impls?.[0];
      if (impl) {
        if (impl.kind === "const" || impl.kind === "var" || impl.kind === "let") {
          prefix = `${impl.kind} ${node.getText()}: `;
        } else if (impl.kind === "function") {
          prefix = `function ${node.getText()}`;
        }
      }

      const typeDefs = service.getTypeDefinitionAtPosition(fileName, node.getStart());
      const typeDef = typeDefs?.[0];
      if (typeDef) {
        if (typeDef.kind === "method") {
          prefix = `(method) ${typeDef.containerName}.${typeDef.name}`;
        } else if (typeDef.kind === "type") {
          prefix = `type ${typeDef.name} = `;
        }
      }

      const defs = service.getDefinitionAtPosition(fileName, node.getStart());
      const def = defs?.[0];
      if (def) {
        if (def.kind === "interface") {
          isInterface = true;
          prefix = `interface ${def.name} `;
        } else if (def.kind === "constructor") {
          prefix = `constructor Bruh`;
        } else if (def.kind === "class") {
          prefix = "class ";
        } else if (def.kind === "property") {
          prefix = `(property) ${[def.containerName, def.name].filter(Boolean).join(".")}: `;
        } else if (def.kind === "parameter") {
          prefix = `(parameter) ${def.name}: `;
        }
      }

      const signatures = typeChecker.getSignaturesOfType(type, ts.SignatureKind.Call);
      const constructorSignatures = type.getConstructSignatures();
      if (signatures.length > 0) {
        // This function has at least 1 overload. Show the first one
        // to reduce noise.
        typeStr = typeChecker.signatureToString(signatures[0]);
      } else if (def?.kind === "constructor" && constructorSignatures.length > 0) {
        // This function has at least 1 overload. Show the first one
        // to reduce noise.
        typeStr = typeChecker.signatureToString(constructorSignatures[0]);
      } else {
        typeStr = typeChecker.typeToString(type);
      }

      if (isInterface) {
        typeStr = "";
      }

      items.push({
        prefix,
        start: node.getStart(),
        end: node.getEnd(),
        type: typeStr,
        line: -1,
      });
    }
    ts.forEachChild(node, dfs);
  }
  ts.forEachChild(file, dfs);

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
        prefix: string;
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

export function injectTypeAnnotations(content: string) {
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
