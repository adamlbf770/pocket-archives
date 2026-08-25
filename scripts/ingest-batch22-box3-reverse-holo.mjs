#!/usr/bin/env node
import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const inbox = join(root, "inventory/Scanner Inbox");
const batch = join(root, "inventory/Batch 22 - Pokemon Box 3 Reverse Holo - PA-3646-PA-3648");
const raw = join(batch, "01 Raw Scanner Output");
const listing = join(batch, "02 Listing Images");
const scanStartMs = new Date("2026-08-24T23:50:00-04:00").getTime();
const scanEndMs = new Date("2026-08-24T23:51:00-04:00").getTime();

const cards = [
  { sku: "PA-3646", rawBack: 2272, rawFront: 2273, name: "Serperior", number: "006/088", rarity: "Rare" },
  { sku: "PA-3647", rawBack: 2274, rawFront: 2275, name: "Vivillon", number: "009/088", rarity: "Uncommon" },
  { sku: "PA-3648", rawBack: 2276, rawFront: 2277, name: "Hawlucha", number: "046/088", rarity: "Common" },
];

await Promise.all([mkdir(raw, { recursive: true }), mkdir(listing, { recursive: true })]);
const archivedNames = await readdir(raw).catch(() => []);
const sourceDir = archivedNames.length === 11 ? raw : inbox;
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
if (runNames.length !== 11) throw new Error(`Safety stop: expected 11 Box 3 scanner files, found ${runNames.length}.`);

const runNameSet = new Set(runNames);
for (let number = 2272; number <= 2277; number += 1) {
  if (!runNameSet.has(`batch-14-card ${number}.jpeg`)) throw new Error(`Safety stop: missing canonical scanner side ${number}.`);
}

const mapping = [];
for (const card of cards) {
  const rawBack = `batch-14-card ${card.rawBack}.jpeg`;
  const rawFront = `batch-14-card ${card.rawFront}.jpeg`;
  const frontImage = `${card.sku}_front.jpg`;
  const backImage = `${card.sku}_back.jpg`;
  await Promise.all([
    normalize(join(sourceDir, rawFront), join(listing, frontImage), 180),
    normalize(join(sourceDir, rawBack), join(listing, backImage), 0),
  ]);
  mapping.push({
    sku: card.sku,
    rawFront,
    rawBack,
    frontRotation: 180,
    backRotation: 0,
    frontImage,
    backImage,
    inventoryLocation: "Box 3",
  });
}

await writeFile(join(batch, "Batch 22 Scan Mapping.csv"), toCsv(mapping, [
  "sku", "rawFront", "rawBack", "frontRotation", "backRotation", "frontImage", "backImage", "inventoryLocation",
]));

const manifest = cards.map((card) => ({
  sku: card.sku,
  game: "Pokemon",
  name: card.name,
  set: "Perfect Order",
  number: card.number,
  year: 2026,
  language: "English",
  rarity: card.rarity,
  finish: "Reverse Holo",
  condition: "Review pending",
  price: "",
  frontImage: join(listing, `${card.sku}_front.jpg`),
  backImage: join(listing, `${card.sku}_back.jpg`),
  inventoryLocation: "Box 3",
  status: "LOCAL ONLY - CONDITION AND PRICING PENDING",
}));
await writeFile(join(batch, "Batch 22 Manifest.csv"), toCsv(manifest, [
  "sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "status",
]));

await writeFile(join(batch, "README.md"), [
  "# Batch 22 — Pokémon Reverse Holos — Box 3",
  "",
  "- SKUs: PA-3646 through PA-3648.",
  "- Three confirmed cards / six exact front-and-back listing images.",
  "- All three fronts were corrected by 180 degrees after scanner auto-orientation; paired backs were already upright.",
  "- All 11 untouched scanner files were preserved, including the scanner duplicate stream.",
  "- Physical inventory location: Box 3 — Reverse Holo Box.",
  "- Local organization only. Condition review, pricing, and eBay publishing remain pending.",
  "",
].join("\n"));

if (sourceDir === inbox) {
  for (const name of runNames) await rename(join(inbox, name), join(raw, name));
}
console.log(`Ingested Batch 22: ${cards.length} reverse-holo cards in Box 3 with ${runNames.length} raw files preserved.`);

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
