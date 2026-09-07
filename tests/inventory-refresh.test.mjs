import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("inventory has an authenticated eBay refresh action", async () => {
  const route = await readFile(new URL("app/api/inventory/sync/route.ts", root), "utf8");
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /EBAY_REFRESH_TOKEN/);
  assert.match(route, /GetMyeBaySelling/);
  assert.match(route, /sell\/fulfillment\/v1\/order/);
  assert.match(route, /inventory_live_state/);
});

test("inventory refresh control is available to desktop and mobile layouts", async () => {
  const component = await readFile(new URL("app/inventory/inventory-catalog.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(component, /Refresh data/);
  assert.match(component, /\/api\/inventory\/sync/);
  assert.match(css, /\.inventory-sync-control/);
  assert.match(css, /@media \(max-width: 700px\)/);
});
