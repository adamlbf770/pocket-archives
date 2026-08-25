#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const inbox = join(root, "inventory/Scanner Inbox");
const batch = join(root, "inventory/Batch 20 - Pokemon Box 7 - PA-3409-PA-3639");
const raw = join(batch, "01 Raw Scanner Output");
const listing = join(batch, "02 Listing Images");
const selectionPath = join(batch, "Batch 20 Front Selection.json");
const scanStartMs = new Date("2026-08-24T23:22:00-04:00").getTime();
const scanEndMs = new Date("2026-08-24T23:32:00-04:00").getTime();

const selection = JSON.parse(await readFile(selectionPath, "utf8"));
if (selection.cards.length !== 231 || selection.cards[0].sku !== "PA-3409" || selection.cards.at(-1).sku !== "PA-3639") {
  throw new Error("Safety stop: Box 7 front selection is not the expected PA-3409–PA-3639 range.");
}

await Promise.all([mkdir(raw, { recursive: true }), mkdir(listing, { recursive: true })]);
const archivedNames = await readdir(raw).catch(() => []);
const sourceDir = archivedNames.length === 1246 ? raw : inbox;
const rawNames = [];
for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.startsWith("batch-14-card") || !entry.name.endsWith(".jpeg")) continue;
  if (sourceDir === raw) {
    rawNames.push(entry.name);
  } else {
    const details = await stat(join(inbox, entry.name));
    if (details.mtimeMs >= scanStartMs && details.mtimeMs <= scanEndMs) rawNames.push(entry.name);
  }
}
if (rawNames.length !== 1246) throw new Error(`Safety stop: expected 1,246 Box 7 raw files, found ${rawNames.length}.`);

const rawNameSet = new Set(rawNames);
const canonical = Array.from({ length: 628 }, (_, index) => `batch-14-card ${2272 + index}.jpeg`);
if (canonical.some((name) => !rawNameSet.has(name))) throw new Error("Safety stop: Box 7 canonical scan stream is incomplete.");
if (selection.cards.some((card) => !rawNameSet.has(card.rawFront))) throw new Error("Safety stop: a selected Box 7 front is absent from the raw archive.");

const mapping = [];
for (const card of selection.cards) {
  const frontImage = `${card.sku}_front.jpg`;
  const rawNumber = Number(card.rawFront.match(/ (\d+)\.jpeg$/)?.[1]);
  if (!Number.isInteger(rawNumber) || rawNumber < 2439) throw new Error(`Safety stop: invalid selected front ${card.rawFront}.`);
  const rawBack = `batch-14-card ${rawNumber - 1}.jpeg`;
  const backImage = `${card.sku}_back.jpg`;
  const backRotation = card.rotation;
  if (!rawNameSet.has(rawBack)) throw new Error(`Safety stop: missing paired back ${rawBack}.`);
  await Promise.all([
    normalize(join(sourceDir, card.rawFront), join(listing, frontImage), card.rotation),
    normalize(join(sourceDir, rawBack), join(listing, backImage), backRotation),
  ]);
  mapping.push({
    sku: card.sku,
    rawFront: card.rawFront,
    rawBack,
    rotation: card.rotation,
    backRotation,
    frontImage,
    backImage,
    box: "Box 7",
    note: "Back-only feeder runs 1-4 disregarded; paired back retained from feeder runs 5-7",
  });
}

const mappingFields = ["sku", "rawFront", "rawBack", "rotation", "backRotation", "frontImage", "backImage", "box", "note"];
await writeFile(join(batch, "Batch 20 Scan Mapping.csv"), toCsv(mapping, mappingFields));

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
  inventoryLocation: "Box 7",
  status: "LOCAL ONLY - IDENTIFICATION PENDING",
}));
const manifestFields = ["sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "status"];
await writeFile(join(batch, "Batch 20 Manifest.csv"), toCsv(manifest, manifestFields));

await writeFile(join(batch, "README.md"), [
  "# Batch 20 — Pokémon — Box 7",
  "",
  "- SKUs: PA-3409 through PA-3639.",
  "- 231 confirmed cards / 462 exact front-and-back listing images.",
  "- The back-only scans from feeder runs 1-4 were disregarded; paired backs from feeder runs 5-7 were retained.",
  "- 1,246 untouched scanner files preserved, including the disregarded back-only runs and the scanner's duplicate output stream.",
  "- 228 front/back pairs required 180-degree correction; three pairs were already upright.",
  "- Physical inventory location: Box 7.",
  "- Local organization only. Identification, condition review, pricing, and eBay publishing remain pending.",
  "",
].join("\n"));

if (sourceDir === inbox) {
  for (const name of rawNames) await rename(join(inbox, name), join(raw, name));
}
console.log(`Ingested Batch 20: ${mapping.length} Box 7 front/back pairs and ${rawNames.length} preserved raw files; feeder runs 1-4 excluded.`);

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
