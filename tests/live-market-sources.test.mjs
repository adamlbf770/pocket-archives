import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("card market endpoint uses legitimate cached sources and owner authentication", async () => {
  const source = await readFile(new URL("app/api/market/card/route.ts", root), "utf8");
  assert.match(source, /getChatGPTUser/);
  assert.match(source, /tcgcsv\.com\/tcgplayer/);
  assert.match(source, /api\.scryfall\.com\/cards\/search/);
  assert.match(source, /api\.pokemontcg\.io\/v2\/cards/);
  assert.match(source, /cardMarketCache/);
  assert.match(source, /Guide prices are supporting evidence/);
});

test("inventory card drawer exposes live source refresh", async () => {
  const source = await readFile(new URL("app/inventory/inventory-catalog.tsx", root), "utf8");
  assert.match(source, /\/api\/market\/card\?sku=/);
  assert.match(source, /Refresh market/);
  assert.match(source, /Live source checks/);
});
