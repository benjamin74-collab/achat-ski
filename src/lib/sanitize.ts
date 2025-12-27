// src/lib/sanitize.ts
import xss from "xss";

export function sanitizeHtml(input: string) {
  // liste blanche minimale (ajuste selon tes besoins)
  const whiteList = {
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    p: [], br: [], hr: [], blockquote: [],
    strong: [], b: [], em: [], i: [], u: [], s: [], mark: [],
    ul: [], ol: [], li: [],
    code: [], pre: [], kbd: [], samp: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [], caption: [],
    a: ["href", "title", "rel", "target"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    figure: [], figcaption: [],
    span: ["class"],
    div: ["class"],
    section: ["class"],
    article: ["class"],
    details: [], summary: []
  } as Record<string, string[]>;

  const options = {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe"],
    css: false,
    onTagAttr(tag: string, name: string, value: string) {
      if (tag === "a" && name === "href") {
        if (!/^(https?:|mailto:|tel:|#)/i.test(value)) return "";
      }
      if (tag === "img" && name === "src") {
        if (!/^(https?:|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(value)) return "";
      }
      return value;
    },
    onTag(tag: string, html: string) {
      if (tag === "a") {
        return html.replace(/^<a\s/i, '<a rel="nofollow noopener" ');
      }
      return html;
    }
  };

  return xss(input, options);
}
