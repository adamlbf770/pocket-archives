#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const batch = join(root, "inventory/Batch 16 - Pokemon - PA-1453-PA-1454");
const output = join(root, "outputs/batch16_review/ebay-drafts");
await mkdir(output, { recursive: true });

const cards = [
  {
    sku: "PA-1453", name: "Clefairy", set: "Base Set", number: "5/102", year: 1999,
    rarity: "Rare Holo", finish: "Holofoil", condition: "Moderately Played", artist: "Ken Sugimori",
    market: 16.99, price: 18.49,
  },
  {
    sku: "PA-1454", name: "Omanyte", set: "Neo Discovery", number: "60/75", year: 2001,
    rarity: "Common", finish: "Regular", condition: "Moderately Played", artist: "Yuka Morii",
    market: 1.99, price: 3.49,
  },
];

for (const card of cards) {
  const delta = card.price - card.market;
  if (delta < 1 || delta > 2) throw new Error(`${card.sku}: price is not $1-$2 above market.`);
  card.title = `Pokemon ${card.name} ${card.number} ${card.set} ${card.finish === "Holofoil" ? "Holo " : ""}MP`;
  card.description = [
    `${card.name} ${card.number} from ${card.set}.`,
    `English. Unlimited. ${card.rarity}. ${card.finish}.`,
    "Condition: Moderately Played (MP).",
    "Card shows visible signs of wear consistent with Moderately Played condition.",
    "Please review all photos carefully for exact condition, including surface, edges, corners, and back.",
    "The card pictured is the exact card you will receive.",
    "Pocket Archives inventory location: Unassigned.",
  ].join("\n\n");
  card.frontImage = join(batch, "02 Listing Images", `${card.sku}_front.jpg`);
  card.backImage = join(batch, "02 Listing Images", `${card.sku}_back.jpg`);
  const draft = {
    sku: card.sku,
    title: card.title,
    description: card.description,
    categoryId: "183454",
    cardCondition: card.condition,
    conditionDescription: "Card shows visible signs of wear consistent with Moderately Played condition. Please review all photos carefully for exact condition.",
    price: card.price,
    quantity: 1,
    aspects: {
      Game: ["Pokémon TCG"],
      "Card Name": [card.name],
      Set: [card.set],
      "Card Number": [card.number],
      Language: ["English"],
      Rarity: [card.rarity],
      Manufacturer: ["The Pokémon Company"],
      Finish: [card.finish === "Holofoil" ? "Holo" : "Regular"],
      "Year Manufactured": [String(card.year)],
    },
    imageUrls: [],
  };
  await writeFile(join(output, `${card.sku}.json`), JSON.stringify(draft, null, 2) + "\n");
}

const manifestPath = join(batch, "Batch 16 Manifest.csv");
const manifest = await readFile(manifestPath, "utf8");
const lines = manifest.trimEnd().split("\n");
const headers = parseCsvLine(lines[0]);
const updated = [headers];
for (const line of lines.slice(1)) {
  const values = parseCsvLine(line);
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const card = cards.find((candidate) => candidate.sku === row.sku);
  if (card) {
    row.price = String(card.price);
    row.pricingBasis = `Condition-specific eBay market ${card.market.toFixed(2)} plus $1.50`;
    row.ebayStatus = "READY FOR EBAY";
  }
  updated.push(headers.map((header) => row[header] ?? ""));
}
await writeFile(manifestPath, updated.map((row) => row.map(csvCell).join(",")).join("\n") + "\n");
console.log("Prepared PA-1453 Clefairy at $18.49 and PA-1454 Omanyte at $3.49.");

function parseCsvLine(line) {
  const fields = []; let field = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { fields.push(field); field = ""; }
    else field += char;
  }
  fields.push(field); return fields;
}
function csvCell(value) { const text = String(value); return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
