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
  assert.match(source, /function canonicalSet/);
  assert.match(source, /reviewedMarket \?\? automatedConsensus/);
  assert.match(source, /schemaVersion: 2/);
});

test("inventory card drawer exposes live source refresh", async () => {
  const source = await readFile(new URL("app/inventory/inventory-catalog.tsx", root), "utf8");
  assert.match(source, /\/api\/market\/card\?sku=/);
  assert.match(source, /Refresh market/);
  assert.match(source, /Live source checks/);
  assert.match(source, /selected\.market\?\.currentPrice \?\? live\?\.consensusMarket/);
});

test("reviewed Expedition Diglett value and exact reverse-holo identity stay in the catalog", async () => {
  const source = await readFile(new URL("app/inventory/catalog.generated.ts", root), "utf8");
  const start = source.indexOf('"sku": "PA-11622"');
  assert.notEqual(start, -1);
  const card = source.slice(start, start + 1_500);
  assert.match(card, /"set": "Expedition Base Set"/);
  assert.match(card, /"number": "106\/165"/);
  assert.match(card, /"finish": "Reverse Holofoil"/);
  assert.match(card, /"condition": "Moderately Played"/);
  assert.match(card, /"currentPrice": 18/);
});
