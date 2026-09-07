import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const readJson = async (path, fallback = null) => {
  try {
    return JSON.parse(await readFile(resolve(root, path), "utf8"));
  } catch {
    return fallback;
  }
};

const registry = await readJson("data/market/source-registry.json", { sources: [] });
const sourceProbes = await readJson("data/market/source-probes.json", { sources: {} });
const storage = await readJson("inventory/Storage Locations.json", { assignments: [] });
const intake = await readJson("inventory/Scanner Intake Sessions.json", { sessions: [] });
const active = await readJson("data/ebay/active-listings.json", { activeListings: [] });
const orders = await readJson("data/ebay/orders.json", { orders: [] });
const soldComps = await readJson("data/deals/sold-comps.json", { sales: [] });
const dealRun = await readJson("outputs/resale-notifier/latest.json", null);

const latest = (...values) => values.filter(Boolean).sort().at(-1) ?? null;
const dynamic = {
  "pocket-archives": {
    lastSuccessAt: latest(storage.updatedAt, intake.updatedAt),
    records: storage.assignments?.length ?? 0,
    detail: `${(storage.assignments?.length ?? 0).toLocaleString()} unique SKU locations · ${(storage.boxes?.length ?? 0).toLocaleString()} physical boxes · ${(intake.sessions?.length ?? 0).toLocaleString()} intake sessions`,
  },
  "ebay-seller": {
    lastSuccessAt: latest(active.exportedAt, orders.exportedAt),
    records: (active.activeListings?.length ?? 0) + (orders.orders?.length ?? 0),
    detail: `${(active.activeListings?.length ?? 0).toLocaleString()} active listings · ${(orders.orders?.length ?? 0).toLocaleString()} sanitized orders`,
  },
  "ebay-browse": {
    lastSuccessAt: dealRun?.runAt ?? null,
    records: dealRun?.candidates?.length ?? 0,
    detail: dealRun ? `${dealRun.candidates.length} discovery candidates in last scan` : "No successful discovery scan recorded",
  },
  "ebay-sold": {
    lastSuccessAt: soldComps.updatedAt ?? null,
    records: soldComps.sales?.length ?? 0,
    detail: `${(soldComps.sales?.length ?? 0).toLocaleString()} verified realized comps · high-confidence BUY remains disabled`,
  },
  "tcgcsv": sourceProbes.sources?.tcgcsv ? {
    lastSuccessAt: sourceProbes.sources.tcgcsv.status === "connected" ? sourceProbes.sources.tcgcsv.checkedAt : null,
    records: sourceProbes.sources.tcgcsv.records ?? 0,
    detail: sourceProbes.sources.tcgcsv.detail,
    status: sourceProbes.sources.tcgcsv.status === "connected" ? "connected" : "not_configured",
    lastError: sourceProbes.sources.tcgcsv.error,
  } : null,
  "pokemon-tcg-api": sourceProbes.sources?.["pokemon-tcg-api"] ? {
    lastSuccessAt: sourceProbes.sources["pokemon-tcg-api"].status === "connected" ? sourceProbes.sources["pokemon-tcg-api"].checkedAt : null,
    records: sourceProbes.sources["pokemon-tcg-api"].records ?? 0,
    detail: sourceProbes.sources["pokemon-tcg-api"].detail,
    status: sourceProbes.sources["pokemon-tcg-api"].status === "connected" ? "connected" : "not_configured",
    lastError: sourceProbes.sources["pokemon-tcg-api"].error,
  } : null,
  "scryfall": sourceProbes.sources?.scryfall ? {
    lastSuccessAt: sourceProbes.sources.scryfall.status === "connected" ? sourceProbes.sources.scryfall.checkedAt : null,
    records: sourceProbes.sources.scryfall.records ?? 0,
    detail: sourceProbes.sources.scryfall.detail,
    status: sourceProbes.sources.scryfall.status === "connected" ? "connected" : "not_configured",
    lastError: sourceProbes.sources.scryfall.error,
  } : null,
};

const sources = registry.sources.map((source) => ({
  ...source,
  status: dynamic[source.id]?.status ?? source.status,
  lastSuccessAt: dynamic[source.id]?.lastSuccessAt ?? null,
  records: dynamic[source.id]?.records ?? null,
  detail: dynamic[source.id]?.detail ?? "No automated data snapshot",
  rateLimitStatus: source.officialApi ? "Runtime quota not yet persisted" : "Not applicable",
  lastError: dynamic[source.id]?.lastError ?? null,
}));

const activeRows = active.activeListings ?? [];
const assignmentRows = storage.assignments ?? [];
const activeWithSku = activeRows.filter((row) => row.sku);
const generatedAt = latest(
  registry.updatedAt,
  storage.updatedAt,
  intake.updatedAt,
  active.exportedAt,
  orders.exportedAt,
  soldComps.updatedAt,
  dealRun?.runAt,
  sourceProbes.checkedAt,
) ?? new Date(0).toISOString();
const snapshot = {
  schemaVersion: 1,
  generatedAt,
  readOnly: true,
  sources,
  summary: {
    connected: sources.filter((source) => source.status === "connected").length,
    attention: sources.filter((source) => source.status !== "connected").length,
    canonicalInventory: assignmentRows.length,
    uniqueInventorySkus: new Set(assignmentRows.map((row) => row.sku)).size,
    activeListings: activeRows.length,
    activeListingsMissingSku: activeRows.length - activeWithSku.length,
    realizedMarketComps: soldComps.sales?.length ?? 0,
    automaticMarketplaceWrites: false,
  },
};

const target = resolve(root, "app/source-health/source-health.generated.ts");
await mkdir(dirname(target), { recursive: true });
await writeFile(
  target,
  `// Generated by scripts/sync-source-health.mjs. Do not edit by hand.\nexport const sourceHealthSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;\n`,
);
console.log(`Source Health synced: ${sources.length} sources, ${snapshot.summary.connected} connected, ${snapshot.summary.attention} requiring attention.`);
