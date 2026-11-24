import assert from "node:assert/strict";
import test from "node:test";
import { selectAdCreative } from "./adCreative";

test("mobile and desktop choose their own code", () => {
  assert.equal(selectAdCreative("desktop728", "mobile300", false), "desktop728");
  assert.equal(selectAdCreative("desktop728", "mobile300", true), "mobile300");
});
test("existing placements keep working without mobile HTML", () => {
  assert.equal(selectAdCreative("desktop728", "  ", true), "desktop728");
});
test("a mobile-only placement does not leak into desktop", () => {
  assert.equal(selectAdCreative("", "mobile300", false), "");
  assert.equal(selectAdCreative("", "mobile300", true), "mobile300");
});
