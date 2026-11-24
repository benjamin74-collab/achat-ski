import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];

/** Use the publisher-provided iframe for known Kwanko image tags.
 * This avoids repeated global SDK initialisation when several slots share a page.
 * Other custom HTML, including any consent integrations, is left untouched.
 */
export function prepareAffiliateHtml(html: string): string {
  if (!/KwankoSDKLoader\.getSlot/.test(html)) return html;
  const root = parseFragment(html, { scriptingEnabled: false });
  function find(node: Node, inNoscript = false): string | null {
    const inside = inNoscript || node.nodeName === "noscript";
    if (inside && node.nodeName === "iframe" && "attrs" in node) {
      const attrs = Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
      try {
        const url = new URL(attrs.src);
        const width = Number(attrs.width);
        const height = Number(attrs.height);
        if (url.protocol === "https:" && ["iza.ekosport.fr", "ctb.intersport.fr"].includes(url.hostname)
          && url.pathname === "/" && /^N[a-z0-9]+$/i.test(url.searchParams.get("a") ?? "")
          && Number.isInteger(width) && width > 0 && width <= 2000
          && Number.isInteger(height) && height > 0 && height <= 2000) {
          const src = url.href.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
          return `<iframe src="${src}" width="${width}" height="${height}" title="Publicité partenaire" loading="lazy" frameborder="0" scrolling="no" style="border:0;display:block"></iframe>`;
        }
      } catch { /* Keep unknown markup unchanged. */ }
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) {
        const result = find(child, inside);
        if (result) return result;
      }
    }
    return null;
  }
  return find(root) ?? html;
}
