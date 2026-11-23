import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";
import { injectInlineAdMarker, splitHtmlByMarker } from "./ads";

type Node = DefaultTreeAdapterMap["node"];
function text(node: Node): string {
  return "value" in node ? node.value : "childNodes" in node ? node.childNodes.map(text).join("") : "";
}
const paragraph = "La description détaille la pratique, les conditions et les caractéristiques du modèle. ".repeat(4);
const input = `<section class="guide-content"><h2 id="intro">Début</h2><p>${paragraph}</p><div class="guide-table"><table><caption>Repères</caption><tbody><tr><th scope="row">Terrain</th><td>${paragraph}</td></tr></tbody></table></div><h2 id="suite">Suite</h2><p>${paragraph}</p><h2 id="fin">Fin</h2><p>${paragraph}</p></section>`;

test("midpoint placement preserves the entire article and each wrapper", () => {
  const marked = injectInlineAdMarker(input);
  const { before, after, hasMarker } = splitHtmlByMarker(marked);
  assert.ok(hasMarker);
  for (const fragment of [before, after]) {
    assert.ok(fragment.startsWith('<section class="guide-content">'));
    assert.ok(fragment.endsWith('</section>'));
    assert.equal(serialize(parseFragment(fragment)), fragment);
  }
  assert.equal(text(parseFragment(before)) + text(parseFragment(after)), text(parseFragment(input)));
  assert.equal((before + after).match(/<table>/g)?.length, 1);
  assert.ok(!before.trim().endsWith('</h2></section>'));
  assert.equal(injectInlineAdMarker(marked), marked);
});

test("short content does not get an arbitrary inline ad", () => {
  const short = '<section class="guide-content"><p>Bonjour.</p></section>';
  assert.equal(injectInlineAdMarker(short), short);
  assert.equal(splitHtmlByMarker(short).hasMarker, false);
});

test("nested editorial wrappers remain balanced on both sides", () => {
  const result = splitHtmlByMarker('<article><section class="guide-content"><p>Avant</p><!--ADSENSE_INLINE_AUTO--><p>Après</p></section></article>');
  assert.equal(result.before, '<article><section class="guide-content"><p>Avant</p></section></article>');
  assert.equal(result.after, '<article><section class="guide-content"><p>Après</p></section></article>');
});

test("product card boundaries preserve enclosing editorial sections", () => {
  const result = splitHtmlByMarker('<section class="guide-content"><p>Avant</p><!--ARTICLE_PRODUCT_BOUNDARY--><h2>Après</h2></section>', '<!--ARTICLE_PRODUCT_BOUNDARY-->');
  assert.equal(result.before, '<section class="guide-content"><p>Avant</p></section>');
  assert.equal(result.after, '<section class="guide-content"><h2>Après</h2></section>');
});

test("an article consisting of one table is never split inside the table", () => {
  const table = `<section class="guide-content"><div class="guide-table"><table><tbody><tr><td>${paragraph.repeat(3)}</td></tr></tbody></table></div></section>`;
  assert.equal(injectInlineAdMarker(table), table);
});
