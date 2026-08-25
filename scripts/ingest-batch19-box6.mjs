#!/usr/bin/env node
import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const inbox = join(root, "inventory/Scanner Inbox");
const batch = join(root, "inventory/Batch 19 - Pokemon Box 6 - PA-2591-PA-3408");
const raw = join(batch, "01 Raw Scanner Output");
const listing = join(batch, "02 Listing Images");
const firstRawNumber = 2272;
const lastRawNumber = 3907;
const firstSkuNumber = 2591;
const cardCount = 818;
const scanStartMs = new Date("2026-08-24T22:48:00-04:00").getTime();
const scanEndMs = new Date("2026-08-24T23:10:00-04:00").getTime();

const runs = [
  [2272, 2283, 180],
  [2284, 2361, 0],
  [2362, 2443, 180],
  [2444, 2497, 0],
  [2498, 2581, 0],
  [2582, 2645, 180],
  [2646, 2731, 0],
  [2732, 2805, 0],
  [2806, 2823, 180],
  [2824, 2895, 180],
  [2896, 2957, 0],
  [2958, 3051, 180],
  [3052, 3085, 180],
  [3086, 3151, 180],
  [3152, 3209, 180],
  [3210, 3237, 180],
  [3238, 3309, 180],
  [3310, 3403, 180],
  [3404, 3413, 180],
  [3414, 3515, 180],
  [3516, 3559, 180],
  [3560, 3633, 180],
  [3634, 3695, 180],
  [3696, 3907, 180],
];

await Promise.all([mkdir(raw, { recursive: true }), mkdir(listing, { recursive: true })]);

const inboxEntries = await readdir(inbox, { withFileTypes: true });
const rawNames = [];
for (const entry of inboxEntries) {
  if (!entry.isFile() || !entry.name.startsWith("batch-14-card") || !entry.name.endsWith(".jpeg")) continue;
  const details = await import("node:fs/promises").then(({ stat }) => stat(join(inbox, entry.name)));
  if (details.mtimeMs >= scanStartMs && details.mtimeMs <= scanEndMs) rawNames.push(entry.name);
}
if (rawNames.length !== 3247) throw new Error(`Safety stop: expected 3,247 Batch 19 raw files, found ${rawNames.length}.`);

const canonical = Array.from({ length: lastRawNumber - firstRawNumber + 1 }, (_, index) =>
  `batch-14-card ${firstRawNumber + index}.jpeg`,
);
const rawNameSet = new Set(rawNames);
const missingCanonical = canonical.filter((name) => !rawNameSet.has(name));
if (canonical.length !== cardCount * 2 || missingCanonical.length) {
  throw new Error(`Safety stop: canonical duplex stream is incomplete (${missingCanonical.length} missing).`);
}

const mapping = [];
let skuNumber = firstSkuNumber;
for (let runIndex = 0; runIndex < runs.length; runIndex += 1) {
  const [start, end, frontRotation] = runs[runIndex];
  if (start % 2 || end % 2 === 0) throw new Error(`Safety stop: run ${runIndex + 1} does not contain complete back/front pairs.`);
  for (let rawNumber = start; rawNumber <= end; rawNumber += 2) {
    const sku = `PA-${String(skuNumber).padStart(4, "0")}`;
    const rawBack = `batch-14-card ${rawNumber}.jpeg`;
    const rawFront = `batch-14-card ${rawNumber + 1}.jpeg`;
    const backRotation = frontRotation === 180 ? 0 : 180;
    const frontImage = `${sku}_front.jpg`;
    const backImage = `${sku}_back.jpg`;
    await Promise.all([
      normalize(join(inbox, rawFront), join(listing, frontImage), frontRotation),
      normalize(join(inbox, rawBack), join(listing, backImage), backRotation),
    ]);
    mapping.push({
      sku,
      scannerRun: runIndex + 1,
      rawFront,
      rawBack,
      frontRotation,
      backRotation,
      frontImage,
      backImage,
      box: "Box 6",
    });
    skuNumber += 1;
  }
}

if (mapping.length !== cardCount || skuNumber !== 3409) {
  throw new Error(`Safety stop: mapped ${mapping.length} cards ending at PA-${skuNumber - 1}.`);
}

const mappingFields = ["sku", "scannerRun", "rawFront", "rawBack", "frontRotation", "backRotation", "frontImage", "backImage", "box"];
await writeFile(join(batch, "Batch 19 Scan Mapping.csv"), toCsv(mapping, mappingFields));

const manifest = mapping.map((row) => ({
  sku: row.sku,
  game: "Pokemon",
  name: "Identification pending",
  set: "Identification pending",
  number: "",
  year: "",
  language: "",
  rarity: "",
  finish: "",
  condition: "",
  price: "",
  frontImage: join(listing, row.frontImage),
  backImage: join(listing, row.backImage),
  inventoryLocation: "Box 6",
  status: "LOCAL ONLY - IDENTIFICATION PENDING",
}));
const manifestFields = ["sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "status"];
await writeFile(join(batch, "Batch 19 Manifest.csv"), toCsv(manifest, manifestFields));

await writeFile(join(batch, "Batch 19 Orientation Audit.json"), JSON.stringify({
  auditedAt: new Date().toISOString(),
  method: "All 24 feeder runs sampled at first, middle, and last fronts; matching backs sampled at each run start.",
  runs: runs.map(([start, end, frontRotation], index) => ({
    scannerRun: index + 1,
    firstRawNumber: start,
    lastRawNumber: end,
    cards: (end - start + 1) / 2,
    frontRotation,
    backRotation: frontRotation === 180 ? 0 : 180,
  })),
}, null, 2) + "\n");

await writeFile(join(batch, "README.md"), [
  "# Batch 19 — Pokémon — Box 6",
  "",
  "- SKUs: PA-2591 through PA-3408.",
  "- 818 physical cards / 1,636 canonical duplex sides.",
  "- 3,247 untouched scanner files preserved, including the scanner's duplicate output stream.",
  "- Horizontal-feed EXIF orientation was normalized in listing copies only.",
  "- All 24 feeder runs were sampled at the first, middle, and last card; mixed run orientation was corrected side-by-side.",
  "- Physical inventory location: Box 6.",
  "- Local organization only. Identification, condition review, pricing, and eBay publishing remain pending.",
  "",
].join("\n"));

for (const name of rawNames) await rename(join(inbox, name), join(raw, name));
console.log(`Ingested Batch 19: ${mapping.length} Box 6 cards, ${mapping.length * 2} upright listing images, and ${rawNames.length} preserved raw files.`);

async function normalize(source, destination, rotation) {
  let pipeline = sharp(source).autoOrient();
  if (rotation) pipeline = pipeline.rotate(rotation);
  await pipeline.jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(destination);
}

function toCsv(rows, fields) {
  return [fields, ...rows.map((row) => fields.map((field) => row[field] ?? ""))]
    .map((record) => record.map(csvCell).join(","))
    .join("\n") + "\n";
}

function csvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
