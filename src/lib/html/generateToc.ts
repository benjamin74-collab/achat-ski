// src/lib/html/generateToc.ts
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { visit } from "unist-util-visit";

export type TocItem = { id: string; text: string; depth: number };

export async function buildHtmlWithHeadings(html: string) {
  // Parse -> add ids -> autolink
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { ariaHidden: "true", className: ["anchor"] }
    });

  const file = await processor.process(html);
  return String(file);
}

export async function extractToc(html: string, levels: Array<"h2"|"h3"|"h4"> = ["h2","h3","h4"]): Promise<TocItem[]> {
  const tree = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .parse(html);

  const tags = new Set(levels);
  const toc: TocItem[] = [];

  visit(tree, "element", (node: any) => {
    if (!tags.has(node.tagName)) return;
    const depth = Number(node.tagName.slice(1)); // h2 -> 2
    const id = (node.properties?.id as string) || "";
    // Récupère le texte plat
    let text = "";
    visit(node, (n: any) => {
      if (n.type === "text") text += n.value;
    });
    text = text.trim();
    if (text) toc.push({ id, text, depth });
  });

  return toc;
}
