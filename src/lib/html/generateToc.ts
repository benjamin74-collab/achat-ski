// src/lib/html/generateToc.ts
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { visit } from "unist-util-visit";
import type { Root, Element, Text } from "hast";

export type TocItem = { id: string; text: string; depth: number };

export async function buildHtmlWithHeadings(html: string) {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { ariaHidden: "true", className: ["anchor"] },
    });

  const file = await processor.process(html);
  return String(file);
}

export async function extractToc(
  html: string,
  levels: Array<"h2" | "h3" | "h4"> = ["h2", "h3", "h4"]
): Promise<TocItem[]> {
  const allowed = new Set(levels);

  const processor = unified().use(rehypeParse, { fragment: true }).use(rehypeSlug);
  const tree = processor.parse(html) as Root;

  const toc: TocItem[] = [];

  // ✅ Pas de génériques sur visit; on type le paramètre
  visit(tree, "element", (node: Element) => {
    const tag = node.tagName as Element["tagName"];
    if (!allowed.has(tag as "h2" | "h3" | "h4")) return;

    const depth = Number((tag as string).slice(1)); // "h2" -> 2

    const idProp = (node.properties as Record<string, unknown> | undefined)?.id;
    const id =
      typeof idProp === "string"
        ? idProp
        : Array.isArray(idProp)
        ? String(idProp[0])
        : "";

    // Récup texte plat du heading
    let text = "";
    visit(node, "text", (t: Text) => {
      text += t.value;
    });
    text = text.trim();

    if (text) toc.push({ id, text, depth });
  });

  return toc;
}
