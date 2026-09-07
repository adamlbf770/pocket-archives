import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const readJson = async (file, fallback) => {
  try { return JSON.parse(await readFile(resolve(root, file), "utf8")); }
  catch { return fallback; }
};

function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers = [], ...values] = rows;
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ""])));
}

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const dayKey = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);
const friendlyDay = (key) => new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", month: "short", day: "numeric",
}).format(new Date(`${key}T12:00:00Z`));

function gameFromTitle(title = "") {
  const value = title.toLowerCase();
  if (value.includes("one piece")) return "One Piece";
  if (value.includes("dragon ball")) return "Dragon Ball";
  if (value.includes("yu-gi-oh") || value.includes("yugioh")) return "Yu-Gi-Oh!";
  if (value.includes("magic") || value.startsWith("mtg ")) return "Magic: The Gathering";
  if (value.includes("riftbound")) return "Riftbound";
  if (value.includes("sorcery")) return "Sorcery";
  return "Pokémon";
}

const active = await readJson("data/ebay/active-listings.json", { activeListings: [] });
const orders = await readJson("data/ebay/orders.json", { orders: [] });
const probes = await readJson("data/market/source-probes.json", { sources: {} });
const catalog = await import(`${pathToFileURL(resolve(root, "app/inventory/catalog.generated.ts")).href}?market=${Date.now()}`);
const inventoryBySku = new Map(catalog.inventoryRecords.map((record) => [record.sku, record]));

const activeRows = active.activeListings ?? [];
const paidOrders = (orders.orders ?? []).filter((order) => order.orderPaymentStatus === "PAID");
const lineItems = paidOrders.flatMap((order) => (order.lineItems ?? []).map((item) => ({ ...item, creationDate: order.creationDate, fulfillmentStatus: order.orderFulfillmentStatus })));
const salesRevenue = money(lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0));
const soldUnits = lineItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
const listedValue = money(activeRows.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantityAvailable || 1), 0));
const activePrices = activeRows.map((item) => Number(item.price || 0)).filter((price) => price > 0).sort((a, b) => a - b);
const medianListPrice = money(activePrices.length ? activePrices[Math.floor(activePrices.length / 2)] : 0);

const today = new Date();
const dailySales = Array.from({ length: 30 }, (_, offset) => {
  const date = new Date(today); date.setUTCHours(12, 0, 0, 0); date.setUTCDate(date.getUTCDate() - (29 - offset));
  const key = dayKey(date);
  const items = lineItems.filter((item) => dayKey(new Date(item.creationDate)) === key);
  return {
    date: key,
    label: friendlyDay(key),
    revenue: money(items.reduce((sum, item) => sum + Number(item.total || 0), 0)),
    units: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
  };
});

const byGame = new Map();
for (const row of activeRows) {
  const record = inventoryBySku.get(row.sku);
  const game = record?.game || gameFromTitle(row.title);
  const current = byGame.get(game) ?? { game, listings: 0, value: 0 };
  current.listings += 1;
  current.value += Number(row.price || 0) * Number(row.quantityAvailable || 1);
  byGame.set(game, current);
}

const salesByGame = new Map();
for (const item of lineItems) {
  const game = inventoryBySku.get(item.sku)?.game || gameFromTitle(item.title);
  const current = salesByGame.get(game) ?? { game, units: 0, revenue: 0 };
  current.units += Number(item.quantity || 1); current.revenue += Number(item.total || 0); salesByGame.set(game, current);
}

let marketRows = [];
try { marketRows = parseCsv(await readFile(resolve(root, "outputs/ebay-market-sweep-2026-09-04/market-position-report.csv"), "utf8")); } catch {}
const activeIds = new Set(activeRows.map((row) => String(row.itemId)));
const comparableRows = marketRows.filter((row) => activeIds.has(String(row.itemId)) && Number(row.marketMedianDelivered) > 0);
const positionCounts = comparableRows.reduce((result, row) => {
  const position = row.position || "unknown"; result[position] = (result[position] || 0) + 1; return result;
}, {});
const totalCurrentComparable = money(comparableRows.reduce((sum, row) => sum + Number(row.deliveredPrice || 0), 0));
const totalMarketComparable = money(comparableRows.reduce((sum, row) => sum + Number(row.marketMedianDelivered || 0), 0));
const marketPremiumPct = totalMarketComparable ? Math.round(((totalCurrentComparable / totalMarketComparable) - 1) * 1000) / 10 : null;

const recentSeven = dailySales.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
const previousSeven = dailySales.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
const sevenDayChangePct = previousSeven ? Math.round(((recentSeven / previousSeven) - 1) * 1000) / 10 : null;
const unshippedOrders = paidOrders.filter((order) => order.orderFulfillmentStatus !== "FULFILLED").length;

const snapshot = {
  schemaVersion: 1,
  generatedAt: [active.exportedAt, orders.exportedAt, probes.checkedAt].filter(Boolean).sort().at(-1) ?? new Date(0).toISOString(),
  readOnly: true,
  summary: {
    activeListings: activeRows.length,
    listedValue,
    medianListPrice,
    paidOrders: paidOrders.length,
    soldUnits,
    salesRevenue,
    averageOrderValue: money(paidOrders.length ? salesRevenue / paidOrders.length : 0),
    sevenDayRevenue: money(recentSeven),
    sevenDayChangePct,
    unshippedOrders,
    comparableListings: comparableRows.length,
    marketPremiumPct,
  },
  dailySales,
  listingValueByGame: [...byGame.values()].map((row) => ({ ...row, value: money(row.value) })).sort((a, b) => b.value - a.value),
  salesByGame: [...salesByGame.values()].map((row) => ({ ...row, revenue: money(row.revenue) })).sort((a, b) => b.revenue - a.revenue),
  marketPosition: {
    asOf: "2026-09-04",
    counts: positionCounts,
    currentDeliveredValue: totalCurrentComparable,
    marketMedianDeliveredValue: totalMarketComparable,
    methodology: "Latest full active-listing comparison; active comparable listings are directional, not realized sales.",
  },
  sources: {
    tcgcsv: probes.sources?.tcgcsv ?? null,
    pokemonTcgApi: probes.sources?.["pokemon-tcg-api"] ?? null,
  },
  topActive: activeRows.slice().sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 8).map((row) => ({
    sku: row.sku || "No SKU", title: row.title, price: money(row.price), url: row.viewItemUrl,
  })),
};

const target = resolve(root, "app/market/market.generated.ts");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `// Generated by scripts/sync-market-dashboard.mjs. Do not edit by hand.\nexport const marketSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;\n`);
console.log(`Market dashboard synced: ${activeRows.length} listings, ${paidOrders.length} paid orders, ${comparableRows.length} comp-covered listings.`);
