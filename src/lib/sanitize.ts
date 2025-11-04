// src/lib/sanitize.ts
import xss from "xss";

/**
 * Sanitize HTML côté serveur, sans jsdom.
 * Adapte la whitelist selon tes besoins SEO/UX.
 */
export function sanitizeHtml(input: string) {
  const whiteList: xss.IWhiteList = {
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
  };

  const options: xss.IFilterXSSOptions = {
    whiteList,
    stripIgnoreTag: true,       // supprime les tags non whitelistés
    stripIgnoreTagBody: ["script", "style", "iframe"],
    css: false,                 // pas de CSS inline
    onTagAttr(tag, name, value) {
      // Sécurise <a>
      if (tag === "a" && name === "href") {
        // n'autorise que http/https/mailto/tel/# ancres
        if (!/^(https?:|mailto:|tel:|#)/i.test(value)) return "";
      }
      // Sécurise <img>
      if (tag === "img" && name === "src") {
        if (!/^(https?:|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(value)) return "";
      }
      return value;
    },
    onTag(tag, html) {
      // ajoute rel="nofollow noopener" par défaut sur les liens
      if (tag === "a") {
        return html.replace(
          /^<a\s/i,
          '<a rel="nofollow noopener" '
        );
      }
      return html;
    }
  };

  return xss(input, options);
}
