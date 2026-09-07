import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("market dashboard remains read-only and labels active comps as directional", async () => {
  const source = await readFile(new URL("../app/market/market.generated.ts", import.meta.url), "utf8");
  assert.match(source, /"readOnly": true/);
  assert.match(source, /directional, not realized sales/);
});

test("market page exposes trends, portfolio mix, and source health", async () => {
  const source = await readFile(new URL("../app/market/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Daily revenue/);
  assert.match(source, /Listing value by game/);
  assert.match(source, /Market coverage/);
});
