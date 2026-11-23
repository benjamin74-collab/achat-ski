// Split parsed HTML trees, never raw markup: each fragment keeps its wrappers.
import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["childNode"];
type Parent = DefaultTreeAdapterMap["parentNode"];
const INLINE_MARKER = "<!--ADSENSE_INLINE_AUTO-->";

function hasChildren(node: Node | Parent): node is Parent {
  return "childNodes" in node;
}

function textLength(node: Node | Parent): number {
  if (node.nodeName === "#text" && "value" in node) return node.value.trim().length;
  return hasChildren(node)
    ? node.childNodes.reduce((sum, child) => sum + textLength(child), 0)
    : 0;
}

function isElement(node: Node): node is DefaultTreeAdapterMap["element"] {
  return "tagName" in node;
}

export function injectInlineAdMarker(html: string, marker = INLINE_MARKER): string {
  if (!html || html.includes(marker)) return html;
  const fragment = parseFragment(html);
  let container: Parent = fragment;

  // Unwrap the editorial shell for placement purposes, but retain it in the tree.
  while (true) {
    const elements: DefaultTreeAdapterMap["element"][] = container.childNodes.filter(isElement);
    const hasLooseText = container.childNodes.some(
      (node) => node.nodeName === "#text" && textLength(node) > 0,
    );
    if (hasLooseText || elements.length !== 1) break;
    const only: DefaultTreeAdapterMap["element"] = elements[0];
    if (!["section", "article", "div"].includes(only.tagName)) break;
    // Do not descend into tables, callouts, lists or other indivisible blocks.
    const classes = only.attrs.find((attr) => attr.name === "class")?.value ?? "";
    if (/\bguide-(table|callout)\b/.test(classes)) break;
    container = only;
  }

  const total = textLength(container);
  if (total < 600) return html;
  let consumed = 0;
  let bestIndex = -1;
  let bestScore = Infinity;
  for (let index = 0; index < container.childNodes.length; index++) {
    const node = container.childNodes[index];
    const ratio = consumed / total;
    if (isElement(node) && ratio >= 0.25 && ratio <= 0.75) {
      const previous = container.childNodes.slice(0, index).filter(isElement).at(-1);
      // Keep a heading with the content it introduces.
      if (previous && !/^h[1-6]$/.test(previous.tagName)) {
        const score = Math.abs(ratio - 0.5) + (node.tagName === "h2" ? 0 : 0.08);
        if (score < bestScore) { bestIndex = index; bestScore = score; }
      }
    }
    consumed += textLength(node);
  }
  if (bestIndex < 0) return html;
  const comment = parseFragment(marker).childNodes[0];
  if (!comment || comment.nodeName !== "#comment") return html;
  comment.parentNode = container;
  container.childNodes.splice(bestIndex, 0, comment);
  return serialize(fragment);
}

export function splitHtmlByMarker(
  html: string,
  marker = INLINE_MARKER,
): { before: string; after: string; hasMarker: boolean } {
  if (!html.includes(marker)) return { before: html, after: "", hasMarker: false };
  const fragment = parseFragment(html);
  const markerText = marker.match(/^<!--([\s\S]*?)-->$/)?.[1];
  if (markerText === undefined) return { before: html, after: "", hasMarker: false };
  let found = false;

  function split(parent: Parent): [Node[], Node[]] {
    const before: Node[] = [];
    const after: Node[] = [];
    for (const child of parent.childNodes) {
      if (found) { after.push(child); continue; }
      if (child.nodeName === "#comment" && "data" in child && child.data === markerText) {
        found = true;
        continue;
      }
      if (hasChildren(child)) {
        const [left, right] = split(child);
        if (found) {
          if (left.length) before.push({ ...child, childNodes: left } as Node);
          if (right.length) after.push({ ...child, childNodes: right } as Node);
        } else before.push(child);
      } else before.push(child);
    }
    return [before, after];
  }

  const [before, after] = split(fragment);
  if (!found) return { before: html, after: "", hasMarker: false };
  return {
    before: serialize({ ...fragment, childNodes: before }),
    after: serialize({ ...fragment, childNodes: after }),
    hasMarker: true,
  };
}
