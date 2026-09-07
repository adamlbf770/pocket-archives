import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("inventory card details expose transparent market fields", async () => {
  const source = await readFile(new URL("../app/inventory/inventory-catalog.tsx", import.meta.url), "utf8");
  assert.match(source, /Current market/);
  assert.match(source, /eBay comp median/);
  assert.match(source, /Last sold here/);
  assert.match(source, /asking prices, not realized sales/);
});

test("inventory sync includes guide, active comp, and store sale data", async () => {
  const source = await readFile(new URL("../scripts/sync-inventory-catalog.mjs", import.meta.url), "utf8");
  assert.match(source, /currentPriceKind/);
  assert.match(source, /activeCompMedian/);
  assert.match(source, /lastSoldPrice/);
  assert.match(source, /marketSource/);
});
