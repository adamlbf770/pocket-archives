import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventoryRoot = resolve(root, "inventory");
const output = resolve(root, "app/inventory/catalog.generated.ts");
const outputsRoot = resolve(root, "outputs");

try {
  await access(resolve(inventoryRoot, "Storage Locations.json"));
  await access(resolve(root, "data/ebay/image-attachments.json"));
  await access(resolve(root, "data/ebay/active-listings.json"));
} catch {
  await access(output);
  console.log("Local inventory sources are unavailable; preserving the generated catalog snapshot.");
  process.exit(0);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [rawHeaders = [], ...records] = rows;
  const headers = rawHeaders.map(normalizeKey);
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function normalizeKey(value) {
  return value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function first(record, ...keys) {
  for (const key of keys) {
    const value = record?.[normalizeKey(key)];
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

function inferGame(record) {
  const direct = record.game;
  if (direct?.toLowerCase().includes("one piece")) return "One Piece Card Game";
  if (direct?.toLowerCase().includes("magic")) return "Magic: The Gathering";
  if (direct?.toLowerCase().includes("dragon ball")) return "Dragon Ball Super";
  if (direct?.toLowerCase().includes("sorcery")) return "Sorcery: Contested Realm";
  if (direct?.toLowerCase().includes("pokemon") || direct?.toLowerCase().includes("pokémon")) return "Pokémon";
  if (record.source.includes("One Piece")) return "One Piece Card Game";
  if (record.source.includes("Magic")) return "Magic: The Gathering";
  if (record.source.includes("Dragon Ball")) return "Dragon Ball Super";
  if (record.source.includes("Sorcery")) return "Sorcery: Contested Realm";
  return "Pokémon";
}

function displayStatus(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("bundled")) return "Bundled";
  if (normalized.includes("listed") || normalized === "published") return "Listed";
  if (normalized.includes("pending")) return "Pending";
  if (normalized.includes("legacy")) return "Cataloged";
  return "Unlisted";
}

function numeric(value) {
  const parsed = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function identityKey(record) {
  return [
    first(record, "name", "cardName"),
    first(record, "set"),
    first(record, "number", "cardNumber"),
    first(record, "language"),
    first(record, "finish", "variantFinish"),
  ].map((value) => String(value).trim().toLowerCase()).join("|");
}

function firstUrl(...values) {
  for (const value of values) {
    const match = String(value ?? "").match(/https?:\/\/[^\s"']+/);
    if (match) return match[0].replace(/[),.;]+$/, "");
  }
  return null;
}

async function loadLatestMarketReport() {
  const directories = await readdir(outputsRoot, { withFileTypes: true }).catch(() => []);
  const candidates = directories
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("ebay-market-sweep-"))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const directory of candidates) {
    try {
      return JSON.parse(await readFile(resolve(outputsRoot, directory, "market-position-report.json"), "utf8"));
    } catch {}
  }
  return null;
}

const storage = JSON.parse(await readFile(resolve(inventoryRoot, "Storage Locations.json"), "utf8"));
const boxLabelById = new Map(storage.boxes.map((box) => [box.id, box.label]));
const imageAttachments = JSON.parse(await readFile(resolve(root, "data/ebay/image-attachments.json"), "utf8"));
const activeExport = JSON.parse(await readFile(resolve(root, "data/ebay/active-listings.json"), "utf8"));
const orderExport = JSON.parse(await readFile(resolve(root, "data/ebay/orders.json"), "utf8").catch(() => '{"orders":[]}'));
const marketReport = await loadLatestMarketReport();

const directories = await readdir(inventoryRoot, { withFileTypes: true });
const manifestPaths = [];
for (const directory of directories) {
  if (!directory.isDirectory() || !directory.name.startsWith("Batch ")) continue;
  const directoryPath = resolve(inventoryRoot, directory.name);
  for (const file of await readdir(directoryPath)) {
    if (file.endsWith("Manifest.csv")) manifestPaths.push(resolve(directoryPath, file));
  }
}

const manifestBySku = new Map();
for (const manifestPath of manifestPaths) {
  const rows = parseCsv(await readFile(manifestPath, "utf8"));
  for (const row of rows) {
    const sku = first(row, "sku");
    if (sku) manifestBySku.set(sku, row);
  }
}

const activeBySku = new Map(
  activeExport.activeListings.filter((item) => item.sku).map((item) => [item.sku, item]),
);
const activeById = new Map(activeExport.activeListings.map((item) => [item.itemId, item]));
const marketBySku = new Map((marketReport?.rows ?? []).map((row) => [row.sku, row]));
const guideMarketByIdentity = new Map();
const activeMarketByIdentity = new Map();
for (const [sku, manifest] of manifestBySku) {
  const key = identityKey(manifest);
  const guidePrice = numeric(first(manifest, "marketPrice", "market", "marketValue"));
  if (guidePrice && !guideMarketByIdentity.has(key)) {
    guideMarketByIdentity.set(key, {
      price: guidePrice,
      source: firstUrl(
        first(manifest, "marketSource", "marketReference", "auditSource", "researchUrl"),
        first(manifest, "notes"),
      ),
    });
  }
  const marketRow = marketBySku.get(sku);
  if (marketRow && !activeMarketByIdentity.has(key)) activeMarketByIdentity.set(key, marketRow);
}
const localPreviewFiles = new Set(
  await readdir(resolve(root, "public/inventory-previews")).catch(() => []),
);

const latestSaleByIdentity = new Map();
for (const order of orderExport.orders ?? []) {
  if (order.orderPaymentStatus !== "PAID") continue;
  for (const lineItem of order.lineItems ?? []) {
    const soldManifest = manifestBySku.get(lineItem.sku);
    if (!soldManifest) continue;
    const key = identityKey(soldManifest);
    const candidate = {
      price: numeric(lineItem.total),
      soldAt: order.creationDate,
      quantity: Number(lineItem.quantity) || 1,
    };
    const current = latestSaleByIdentity.get(key);
    if (!current || candidate.soldAt > current.soldAt) latestSaleByIdentity.set(key, candidate);
  }
}

const records = storage.assignments.map((assignment) => {
  const manifest = manifestBySku.get(assignment.sku) ?? {};
  const key = identityKey({ ...manifest, ...assignment });
  const listingId = first(manifest, "listingId", "ebayListingId") || assignment.listingId || "";
  const active = activeBySku.get(assignment.sku) ?? activeById.get(listingId);
  const images = imageAttachments[assignment.sku]?.imageUrls ?? [];
  const localFront = `${assignment.sku}_front.jpg`;
  const localBack = `${assignment.sku}_back.jpg`;
  const priceText = active?.price ?? (first(manifest, "price", "proposedPrice") || assignment.price);
  const price = Number(priceText);
  const market = marketBySku.get(assignment.sku) ?? activeMarketByIdentity.get(key);
  const inheritedGuide = guideMarketByIdentity.get(key);
  const guideMarket = numeric(first(manifest, "marketPrice", "market", "marketValue")) ?? inheritedGuide?.price ?? null;
  const activeMedian = numeric(market?.marketMedianDelivered);
  const currentMarket = guideMarket ?? activeMedian;
  const marketSource = firstUrl(
    first(manifest, "marketSource", "marketReference", "auditSource", "researchUrl"),
    first(manifest, "notes"),
  ) ?? inheritedGuide?.source ?? null;
  const lastSale = latestSaleByIdentity.get(key);
  const marketSnapshot = currentMarket || activeMedian || lastSale?.price ? {
    currentPrice: currentMarket,
    currentPriceKind: guideMarket ? "Guide market" : activeMedian ? "eBay active median" : null,
    source: marketSource,
    updatedAt: marketReport?.auditedAt ?? null,
    activeCompMedian: activeMedian,
    activeCompLow: numeric(market?.marketQ25Delivered),
    activeCompHigh: numeric(market?.marketQ75Delivered),
    activeCompCount: Number(market?.exactCompCount) || 0,
    lastSoldPrice: lastSale?.price ?? null,
    lastSoldAt: lastSale?.soldAt ?? null,
    lastSoldQuantity: lastSale?.quantity ?? null,
  } : null;
  return {
    sku: assignment.sku,
    name: assignment.name || first(manifest, "name", "cardName") || "Unidentified card",
    game: inferGame(assignment),
    set: assignment.set || first(manifest, "set") || "Unidentified set",
    number: assignment.number || first(manifest, "number", "cardNumber") || "",
    year: assignment.year || Number(first(manifest, "year")) || null,
    language: assignment.language || first(manifest, "language") || "Unknown",
    finish: assignment.finish || first(manifest, "finish", "variantFinish") || "Unknown",
    condition: first(manifest, "condition") || "Not recorded",
    rarity: first(manifest, "rarity") || "Not recorded",
    artist: assignment.artist || first(manifest, "artist", "illustrator") || "Not recorded",
    boxId: assignment.boxId,
    box: assignment.inventoryLocation || boxLabelById.get(assignment.boxId) || assignment.boxId,
    status: active
      ? "Listed"
      : displayStatus(assignment.status || first(manifest, "status", "ebayStatus", "listingStatus")),
    price: Number.isFinite(price) && price > 0 ? price : null,
    market: marketSnapshot,
    listingId: active?.itemId || listingId || null,
    listingUrl: active?.viewItemUrl || first(manifest, "ebayUrl") || assignment.listingUrl || null,
    frontImage: images[0] || (localPreviewFiles.has(localFront) ? `/inventory-previews/${localFront}` : null),
    backImage: images[1] || (localPreviewFiles.has(localBack) ? `/inventory-previews/${localBack}` : null),
  };
});

const generated = `// Generated by npm run sync:inventory. Do not edit by hand.\n` +
  `export const inventoryUpdatedAt = ${JSON.stringify(storage.updatedAt)};\n` +
  `export const inventoryBoxes = ${JSON.stringify(storage.boxes, null, 2)} as const;\n` +
  `export const inventoryRecords = ${JSON.stringify(records, null, 2)} as const;\n`;

await writeFile(output, generated, "utf8");
console.log(`Synced ${records.length} inventory records with ${records.filter((record) => record.frontImage).length} scan previews.`);
