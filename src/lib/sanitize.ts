// src/lib/sanitize.ts
import xss from "xss";

export function sanitizeHtml(input: string) {
  // Liste blanche minimale
  const whiteList = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    p: [],
    br: [],
    hr: [],
    blockquote: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    mark: [],
    ul: [],
    ol: [],
    li: [],
    code: [],
    pre: [],
    kbd: [],
    samp: [],
    table: [],
    thead: [],
    tbody: [],
    tr: [],
    th: [],
    td: [],
    caption: [],
    a: ["href", "title", "rel", "target"],
    img: [
      "src",
      "alt",
      "width",
      "height",
      "loading",
      "decoding",
    ],
    figure: [],
    figcaption: [],
    span: ["class"],
    div: ["class"],
    section: ["class"],
    article: ["class"],
    details: [],
    summary: [],
  } as Record<string, string[]>;

  const options = {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: [
      "script",
      "style",
      "iframe",
    ],
    css: false,

    onTagAttr(
      tag: string,
      name: string,
      value: string,
    ) {
      if (
        tag === "a" &&
        name === "href"
      ) {
        /*
         * Autorise :
         * - liens internes absolus : /categorie
         * - ancres : #section
         * - HTTP / HTTPS
         * - mailto:
         * - tel:
         *
         * Les liens internes doivent rester
         * follow pour le maillage SEO.
         */
        if (
          !/^\/(?!\/)/.test(value) &&
          !/^(https?:|mailto:|tel:|#)/i.test(
            value,
          )
        ) {
          return "";
        }
      }

      if (
        tag === "img" &&
        name === "src"
      ) {
        if (
          !/^(https?:|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(
            value,
          )
        ) {
          return "";
        }
      }

      return value;
    },

    onTag(
      tag: string,
      html: string,
    ) {
      if (tag !== "a") {
        return html;
      }

      /*
       * Liens internes :
       * on retire les éventuels attributs
       * nofollow / noopener / noreferrer
       * enregistrés dans l'ancien contenu.
       */
      if (
        /href=(["'])\/(?!\/)/i.test(
          html,
        ) ||
        /href=(["'])#/i.test(html)
      ) {
        return html
          .replace(
            /\srel=(["'])[^"']*\1/gi,
            "",
          )
          .replace(
            /\starget=(["'])_blank\1/gi,
            "",
          );
      }

      /*
       * Liens HTTP(S) externes :
       * nofollow + protections liées
       * à target="_blank".
       */
      if (
        /href=(["'])https?:\/\//i.test(
          html,
        )
      ) {
        const withoutRel =
          html.replace(
            /\srel=(["'])[^"']*\1/gi,
            "",
          );

        return withoutRel.replace(
          /^<a\s/i,
          '<a rel="nofollow noopener noreferrer" ',
        );
      }

      /*
       * mailto: et tel:
       * aucun nofollow nécessaire.
       */
      return html.replace(
        /\srel=(["'])[^"']*\1/gi,
        "",
      );
    },
  };

  return xss(input, options);
}