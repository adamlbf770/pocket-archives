import assert from "node:assert/strict";
import test from "node:test";
import { probeSource, sourceAdapters } from "../scripts/market/source-adapters.mjs";

test("TCGCSV probe accepts a successful non-empty market response", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ success: true, results: [{ categoryId: 1 }, { categoryId: 3 }, { categoryId: 999 }] }),
  });
  const result = await probeSource(sourceAdapters.tcgcsv, { fetchImpl });
  assert.equal(result.status, "connected");
  assert.equal(result.records, 2);
  assert.equal(result.error, null);
});

test("Scryfall probe recognizes an exact card response", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ object: "card", name: "Black Lotus" }) });
  const result = await probeSource(sourceAdapters.scryfall, { fetchImpl });
  assert.equal(result.status, "connected");
  assert.equal(result.records, 1);
});

test("source probe reports failures without throwing", async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 });
  const result = await probeSource(sourceAdapters.pokemonTcgApi, { fetchImpl });
  assert.equal(result.status, "attention");
  assert.equal(result.records, 0);
  assert.match(result.error, /HTTP 503/);
});
