import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("inventory page sends only the first result page to the browser", async () => {
  const page = await readFile(new URL("app/inventory/page.tsx", root), "utf8");
  assert.match(page, /slice\(0, 30\)/);
  assert.doesNotMatch(page, /records=\{inventoryRecords\}/);
});

test("search and filters run through the authenticated server endpoint", async () => {
  const client = await readFile(new URL("app/inventory/inventory-catalog.tsx", root), "utf8");
  const endpoint = await readFile(new URL("app/api/inventory/search/route.ts", root), "utf8");
  assert.match(client, /\/api\/inventory\/search/);
  assert.match(client, /setTimeout/);
  assert.match(client, /firstSearch/);
  assert.match(endpoint, /getChatGPTUser/);
  assert.match(endpoint, /Math\.min\(120/);
});

test("eBay refresh supports compact responses", async () => {
  const endpoint = await readFile(new URL("app/api/inventory/sync/route.ts", root), "utf8");
  assert.match(endpoint, /compact/);
  assert.match(endpoint, /new URL\(request\.url\)/);
});
