import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the market source registry is unique and read-only", async () => {
  const registry = JSON.parse(await readFile(new URL("data/market/source-registry.json", root), "utf8"));
  const ids = registry.sources.map((source) => source.id);

  assert.equal(registry.readOnly, true);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("pocket-archives"));
  assert.ok(ids.includes("ebay-seller"));
  assert.ok(ids.includes("ebay-sold"));
});

test("source health never promotes active asks to realized comps", async () => {
  const generated = await readFile(new URL("app/source-health/source-health.generated.ts", root), "utf8");
  const payload = generated
    .replace(/^.*?export const sourceHealthSnapshot = /s, "")
    .replace(/ as const;\s*$/, "");
  const snapshot = JSON.parse(payload);
  const sold = snapshot.sources.find((source) => source.id === "ebay-sold");

  assert.equal(snapshot.readOnly, true);
  assert.equal(snapshot.summary.automaticMarketplaceWrites, false);
  assert.equal(snapshot.summary.realizedMarketComps, 0);
  assert.equal(sold.status, "access_pending");
  assert.match(sold.detail, /high-confidence BUY remains disabled/i);
});
