#!/usr/bin/env node
import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const inbox = join(root, "inventory/Scanner Inbox");
const firstSide = 2272;
const lastSide = 2967;
const firstSku = 3649;
const cardCount = 348;
const batch = join(root, "inventory/Batch 23 - Pokemon Box 1 - PA-3649-PA-3996");
const raw = join(batch, "01 Raw Scanner Output");
const listing = join(batch, "02 Listing Images");
const scanStartMs = new Date("2026-08-24T23:56:50-04:00").getTime();
const scanEndMs = new Date("2026-08-25T00:05:10-04:00").getTime();

await Promise.all([mkdir(raw, { recursive: true }), mkdir(listing, { recursive: true })]);
const archivedNames = await readdir(raw).catch(() => []);
const sourceDir = archivedNames.length === 1382 ? raw : inbox;
const runNames = [];
for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.startsWith("batch-14-card") || !entry.name.endsWith(".jpeg")) continue;
  if (sourceDir === raw) {
    runNames.push(entry.name);
  } else {
    const details = await stat(join(inbox, entry.name));
    if (details.mtimeMs >= scanStartMs && details.mtimeMs <= scanEndMs) runNames.push(entry.name);
  }
}
if (runNames.length !== 1382) throw new Error(`Safety stop: expected 1,382 Box 1 scanner files, found ${runNames.length}.`);

const runNameSet = new Set(runNames);
for (let number = firstSide; number <= lastSide; number += 1) {
  if (!runNameSet.has(`batch-14-card ${number}.jpeg`)) throw new Error(`Safety stop: missing canonical scanner side ${number}.`);
}

const mapping = [];
for (let index = 0; index < cardCount; index += 1) {
  const sku = `PA-${String(firstSku + index).padStart(4, "0")}`;
  const rawBackNumber = firstSide + index * 2;
  const rawFrontNumber = rawBackNumber + 1;
  const rawBack = `batch-14-card ${rawBackNumber}.jpeg`;
  const rawFront = `batch-14-card ${rawFrontNumber}.jpeg`;
  const frontImage = `${sku}_front.jpg`;
  const backImage = `${sku}_back.jpg`;
  await Promise.all([
    normalize(join(sourceDir, rawFront), join(listing, frontImage), 180),
    normalize(join(sourceDir, rawBack), join(listing, backImage), 0),
  ]);
  mapping.push({
    sku,
    rawFront,
    rawBack,
    frontRotation: 180,
    backRotation: 0,
    frontImage,
    backImage,
    inventoryLocation: "Box 1",
  });
}

await writeFile(join(batch, "Batch 23 Scan Mapping.csv"), toCsv(mapping, [
  "sku", "rawFront", "rawBack", "frontRotation", "backRotation", "frontImage", "backImage", "inventoryLocation",
]));

const manifest = mapping.map((row) => ({
  sku: row.sku,
  game: "Pokemon",
  name: "Identification pending",
  set: "Identification pending",
  number: "",
  year: "",
  language: "",
  rarity: "",
  finish: "Non-Holo",
  condition: "Review pending",
  price: "",
  frontImage: join(listing, row.frontImage),
  backImage: join(listing, row.backImage),
  inventoryLocation: "Box 1",
  status: "LOCAL ONLY - IDENTIFICATION, CONDITION, AND PRICING PENDING",
}));
await writeFile(join(batch, "Batch 23 Manifest.csv"), toCsv(manifest, [
  "sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "status",
]));

await writeFile(join(batch, "README.md"), [
  "# Batch 23 — Vintage Pokémon Non-Holo — Box 1",
  "",
  "- SKUs: PA-3649 through PA-3996.",
  "- 348 confirmed cards / 696 exact front-and-back listing images across 10 feeder loads.",
  "- Every canonical even-numbered side is the paired back; every following odd-numbered side is its front.",
  "- All fronts were corrected by 180 degrees after scanner auto-orientation; paired backs were already upright.",
  "- All 1,382 untouched scanner files were preserved, including the scanner duplicate stream.",
  "- Physical inventory location: Box 1 — Vintage English and Japanese Non-Holo Pokémon.",
  "- Local organization only. Identification, condition review, pricing, and eBay publishing remain pending.",
  "",
].join("\n"));

if (sourceDir === inbox) {
  for (const name of runNames) await rename(join(inbox, name), join(raw, name));
}
console.log(`Ingested Batch 23: ${cardCount} Box 1 cards with ${runNames.length} raw scanner files preserved.`);

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
