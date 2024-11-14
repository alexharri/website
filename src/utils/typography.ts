import { Plugin } from "unified";
import { Root, Node as BaseNode, Text as TextNode } from "hast";

type Node = Root | BaseNode | TextNode;

const DQ = '"'; // Double quote
const LDQ = "“"; // Left double quote
const RDQ = "”"; // Right double quote

const SQ = "'"; // Single quote
const LSQ = "\u2018"; // Left single quote
const RSQ = "\u2019"; // Right single quote

const QUOTE_APOS_REPLACEMENT_PAIRS = [
  [DQ, LDQ, RDQ],
  [SQ, LSQ, RSQ],
];

const EM_DASH = "—";

const whitespaceOrPunctuation = /\s|\p{P}/u;

const INLINE_ELEMENT: TextNode = { type: "text", value: "X" };
const FAKE_NEWLINE: TextNode = { type: "text", value: "\n" };

const blockElements = new Set([
  "paragraph",
  "listItem",
  "heading",
  "blockquote",
  "code",
  "mdxJsxFlowElement", // E.g. images
  "mdxFlowExpression", // Stuff like {<table>...</table>} (see bit set iteration post)
  "thematicBreak", // <hr> element
]);
const inlineElements = new Set(["inlineMath", "inlineCode"]);
const ignoreElements = new Set([
  "link",
  "linkReference",
  "mdxJsxTextElement",
  "emphasis",
  "strong",
  "definition",
  "root",
  "list",
]);

function collectTextNodes(root: Node): TextNode[] {
  const textNodes: TextNode[] = [FAKE_NEWLINE];

  function dfs(node: Node) {
    if (node.type === "text") textNodes.push(node as TextNode);
    else if (blockElements.has(node.type)) textNodes.push(FAKE_NEWLINE);
    else if (inlineElements.has(node.type)) textNodes.push(INLINE_ELEMENT);
    else if (!ignoreElements.has(node.type)) {
      console.log(`Unknown element type: ${node.type}`);
    }

    if ("children" in node) {
      for (const child of node.children) {
        dfs(child);
      }
      if (blockElements.has(node.type)) textNodes.push(FAKE_NEWLINE);
    }
  }
  dfs(root);

  textNodes.push(FAKE_NEWLINE);

  return textNodes;
}

export function applyPrettyTypography(value: string, left: string = "\n", right: string = "\n") {
  let s = value;

  for (let i = 0; i < s.length; i++) {
    // Handle em dashes
    if (s[i] === "-" && s[i + 1] === "-" && s[i + 2] !== "-" && s[i - 1] !== "-") {
      s = s.slice(0, i) + EM_DASH + s.slice(i + 2);
    }

    // Handle quotes
    for (const [c, open_c, close_c] of QUOTE_APOS_REPLACEMENT_PAIRS) {
      if (s[i] === c) {
        const prev = i === 0 ? left : s[i - 1];
        const next = i === s.length - 1 ? right : s[i + 1];

        // Special case: a double apostrophe ('') is converted to a right single quote.
        //
        // This can be used to force right quotes when it's ambiguous whether a quote is
        // being opened or letters are being omitted (e.g. in the phrase "Back in '99").
        if (c === SQ && next == SQ) {
          s = s.slice(0, i) + close_c + s.slice(i + 2); // +2 to remove the second quote
        }
        // Whitespace/punctuation followed by characters converts to a left quote (open quote)
        else if (whitespaceOrPunctuation.test(prev) && !whitespaceOrPunctuation.test(next)) {
          s = s.slice(0, i) + open_c + s.slice(i + 1);
        }
        // Otherwise, use right quote
        else {
          s = s.slice(0, i) + close_c + s.slice(i + 1);
        }
      }
    }
  }

  return s;
}

export const typographyPlugin: Plugin<unknown[], Node> = () => {
  return function plugin(root: Node, ..._rest: unknown[]) {
    const textNodes = collectTextNodes(root);

    for (let i = 1; i < textNodes.length - 1; i++) {
      if (textNodes[i] === FAKE_NEWLINE) continue;

      const value = textNodes[i].value;

      // The characters immediately preceding and following the current value
      const left = textNodes[i - 1].value.slice(-1);
      const right = textNodes[i + 1].value[0];

      textNodes[i].value = applyPrettyTypography(value, left, right);
    }
  };
};
