import assert from "node:assert/strict";
import test from "node:test";
import { prepareAffiliateHtml } from "./affiliateHtml";
const tag = (src: string) => `<script>new KwankoSDKLoader.getSlot("S123")</script><noscript><iframe src="${src}" width="728" height="90"></iframe></noscript>`;
test("known partner uses its original iframe without the shared SDK", () => {
  for (const host of ["iza.ekosport.fr", "ctb.intersport.fr"]) {
    const src = `https://${host}/?a=N123`;
    const output = prepareAffiliateHtml(tag(src));
    assert.ok(output.includes(src));
    assert.ok(output.includes('width="728" height="90"'));
    assert.ok(!output.includes("<script"));
  }
});
test("unrecognised or unsafe snippets stay unchanged", () => {
  for (const html of ["<p>Publicité</p>", tag("javascript:alert(1)"), tag("https://other.example/?a=N123"), tag("https://iza.ekosport.fr/?wrong=123")]) {
    assert.equal(prepareAffiliateHtml(html), html);
  }
});
