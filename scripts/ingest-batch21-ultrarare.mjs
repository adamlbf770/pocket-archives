#!/usr/bin/env node
import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const inbox = join(root, "inventory/Scanner Inbox");
const batch = join(root, "inventory/Batch 21 - Pokemon Ultrarare Box - PA-3640-PA-3645");
const raw = join(batch, "01 Raw Scanner Output");
const listing = join(batch, "02 Listing Images");
const scanStartMs = new Date("2026-08-24T23:43:00-04:00").getTime();
const scanEndMs = new Date("2026-08-24T23:45:00-04:00").getTime();

const cards = [
  { sku: "PA-3640", rawBack: 2272, rawFront: 2273, name: "Mega Abomasnow ex", set: "Mega Symphonia", number: "018/063", year: 2025, language: "Japanese", rarity: "Double Rare", finish: "Holofoil" },
  { sku: "PA-3641", rawBack: 2274, rawFront: 2275, name: "Lapras", set: "Base Set", number: "10/102", year: 1999, language: "English", rarity: "Holo Rare", finish: "Holofoil" },
  { sku: "PA-3642", rawBack: 2276, rawFront: 2277, name: "Chansey", set: "Bandai Carddass Pocket Monsters", number: "File No.113", year: 1997, language: "Japanese", rarity: "", finish: "Non-Holo" },
  { sku: "PA-3643", rawBack: 2278, rawFront: 2279, name: "Slowbro", set: "Bandai Carddass Pocket Monsters", number: "File No.080", year: 1997, language: "Japanese", rarity: "", finish: "Non-Holo" },
  { sku: "PA-3644", rawBack: 2280, rawFront: 2281, name: "Hypno", set: "Bandai Carddass Pocket Monsters", number: "File No.097", year: 1997, language: "Japanese", rarity: "", finish: "Non-Holo" },
  { sku: "PA-3645", rawBack: 2282, rawFront: 2283, name: "Marowak", set: "Bandai Carddass Pocket Monsters", number: "File No.105", year: 1997, language: "Japanese", rarity: "", finish: "Non-Holo" },
];

await Promise.all([mkdir(raw, { recursive: true }), mkdir(listing, { recursive: true })]);
const archivedNames = await readdir(raw).catch(() => []);
const sourceDir = archivedNames.length === 22 ? raw : inbox;
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
if (runNames.length !== 22) throw new Error(`Safety stop: expected 22 Ultrarare Box scanner files, found ${runNames.length}.`);

const runNameSet = new Set(runNames);
for (let number = 2272; number <= 2283; number += 1) {
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
    inventoryLocation: "Ultrarare Box",
  });
}

await writeFile(join(batch, "Batch 21 Scan Mapping.csv"), toCsv(mapping, [
  "sku", "rawFront", "rawBack", "frontRotation", "backRotation", "frontImage", "backImage", "inventoryLocation",
]));

const manifest = cards.map((card) => ({
  sku: card.sku,
  game: "Pokemon",
  name: card.name,
  set: card.set,
  number: card.number,
  year: card.year,
  language: card.language,
  rarity: card.rarity,
  finish: card.finish,
  condition: "Review pending",
  price: "",
  frontImage: join(listing, `${card.sku}_front.jpg`),
  backImage: join(listing, `${card.sku}_back.jpg`),
  inventoryLocation: "Ultrarare Box",
  status: "LOCAL ONLY - CONDITION AND PRICING PENDING",
}));
await writeFile(join(batch, "Batch 21 Manifest.csv"), toCsv(manifest, [
  "sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "status",
]));

await writeFile(join(batch, "README.md"), [
  "# Batch 21 — Pokémon — Ultrarare Box",
  "",
  "- SKUs: PA-3640 through PA-3645.",
  "- Six confirmed cards / 12 exact front-and-back listing images.",
  "- All six fronts were corrected by 180 degrees after scanner auto-orientation; paired backs were already upright.",
  "- All 22 untouched scanner files were preserved, including the scanner duplicate stream.",
  "- Physical inventory location: Ultrarare Box.",
  "- Local organization only. Condition review, pricing, and eBay publishing remain pending.",
  "",
].join("\n"));

if (sourceDir === inbox) {
  for (const name of runNames) await rename(join(inbox, name), join(raw, name));
}
console.log(`Ingested Batch 21: ${cards.length} cards in Ultrarare Box with ${runNames.length} raw scanner files preserved.`);

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
