#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const batch = join(root, "inventory/Batch 15 - Magic - PA-1354-PA-1452");
const imageDir = join(batch, "02 Listing Images");
const review = join(root, "outputs/batch15_magic_review");
const draftDir = join(review, "ebay-drafts");
await mkdir(draftDir, { recursive: true });

const identified = JSON.parse(await readFile(join(review, "identifications.json"), "utf8"));
if (identified.length !== 99) throw new Error("Safety stop: Batch 15 does not contain 99 identification rows.");

const overrides = {
  "PA-1365": "0de0a010-76a7-460f-bb4e-a152c10c3bb7", // Ophidian, Weatherlight
  "PA-1369": "319d252e-7c43-47d6-8873-f69b0e063256", // Earthlore, Ice Age
  "PA-1380": "6d99204c-b42d-48bc-9a93-fae5660665c7", // Wildfire Emissary, Mirage
  "PA-1381": "6d99204c-b42d-48bc-9a93-fae5660665c7", // Wildfire Emissary, Mirage
  "PA-1391": "ee6758f0-86da-4812-bbe0-ebbb8c67937a", // Pacifism, Seventh Edition
  "PA-1423": "ee6758f0-86da-4812-bbe0-ebbb8c67937a", // Pacifism, Seventh Edition
  "PA-1434": "4990dd4b-2b18-4e4c-81d4-1cd8d746a7dc", // Orcish Veteran 62d
  "PA-1441": "eb8efbec-e8bf-4e34-bf13-b43916d2e9ff", // Sky Spirit, Tempest
  "PA-1447": "0ad9744f-797a-4dd3-8617-192773be995c", // Pygmy Razorback, Prophecy
};

const cardCache = new Map();
async function cardById(id) {
  if (cardCache.has(id)) return cardCache.get(id);
  const response = await fetch(`https://api.scryfall.com/cards/${id}`, {
    headers: { "User-Agent": "PocketArchivesInventory/1.0 contact@pocketarchives.com" },
  });
  if (!response.ok) throw new Error(`Scryfall card ${id}: HTTP ${response.status}`);
  const card = await response.json();
  cardCache.set(id, card);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 120));
  return card;
}

const rows = [];
for (const match of identified) {
  const source = overrides[match.sku]
    ? await cardById(overrides[match.sku])
    : match.best && await cardById(match.best.id);
  if (!source?.name || !source?.set_name || !source?.collector_number) {
    throw new Error(`${match.sku}: unresolved exact Magic printing.`);
  }
  const market = Number(source.prices?.usd);
  if (!Number.isFinite(market) || market <= 0) throw new Error(`${match.sku}: no current Scryfall USD market price.`);
  const price = priceAboveMarket(market);
  const delta = price - market;
  if (delta < 1 - 0.001 || delta > 2 + 0.001) throw new Error(`${match.sku}: price delta ${delta.toFixed(2)} is outside $1-$2.`);
  const year = Number(source.released_at.slice(0, 4));
  const rarity = titleCase(source.rarity);
  const condition = "Lightly Played";
  const title = ebayTitle(`MTG ${source.name} ${source.collector_number} ${source.set_name} Nonfoil LP`);
  const description = [
    `${source.name} #${source.collector_number} from ${source.set_name}.`,
    `Magic: The Gathering. English. ${rarity}. Non-foil.`,
    "Condition: Lightly Played (LP).",
    "Card may show minor edge, corner, or surface wear consistent with Lightly Played condition.",
    "Please review all photos carefully for exact condition, including surface, edges, corners, and back.",
    "The card pictured is the exact card you will receive.",
    "Pocket Archives inventory location: Box 2.",
  ].join("\n\n");
  const row = {
    sku: match.sku,
    game: "Magic: The Gathering",
    name: source.name,
    set: source.set_name,
    setCode: source.set.toUpperCase(),
    number: source.collector_number,
    year,
    language: "English",
    rarity,
    finish: "Non-Foil",
    condition,
    artist: source.artist ?? "Not recorded",
    scryfallId: source.id,
    market,
    price,
    pricingBasis: "Current Scryfall USD market plus $1-$2",
    title,
    description,
    frontImage: join(imageDir, `${match.sku}_front.jpg`),
    backImage: join(imageDir, `${match.sku}_back.jpg`),
    box: "Box 2",
    status: "Ready for eBay",
  };
  rows.push(row);
  const draft = {
    sku: row.sku,
    title: row.title,
    description: row.description,
    categoryId: "183454",
    cardCondition: row.condition,
    conditionDescription: "Card may show minor edge, corner, or surface wear consistent with Lightly Played condition. Please review all photos carefully for exact condition.",
    price: row.price,
    quantity: 1,
    aspects: {
      Game: ["Magic: The Gathering"],
      "Card Name": [row.name],
      Set: [row.set],
      "Card Number": [row.number],
      Language: [row.language],
      Rarity: [row.rarity],
      Manufacturer: ["Wizards of the Coast"],
      Finish: ["Regular"],
      "Year Manufactured": [String(row.year)],
    },
    imageUrls: [],
  };
  await writeFile(join(draftDir, `${row.sku}.json`), JSON.stringify(draft, null, 2) + "\n");
}

await writeFile(join(review, "batch15-identities-pricing.json"), JSON.stringify(rows, null, 2) + "\n");
await writeFile(join(batch, "Batch 15 Manifest.csv"), toCsv(rows));
console.log(`Finalized ${rows.length} Magic cards. Market total $${sum(rows, "market").toFixed(2)}; list total $${sum(rows, "price").toFixed(2)}.`);

function priceAboveMarket(market) {
  const target = market + 1.49;
  const price = Math.round((target - 0.49) / 0.5) * 0.5 + 0.49;
  return Number(Math.max(1.49, price).toFixed(2));
}
function titleCase(value) { return String(value).replace(/\b\w/g, (character) => character.toUpperCase()); }
function ebayTitle(value) {
  let title = value.replace(/\s+/g, " ").trim();
  const replacements = [["Magic: The Gathering", "MTG"], ["Duel Decks Anthology: ", "DDA "], ["Innistrad Remastered", "INR"], ["Time Spiral Timeshifted", "TSB"]];
  for (const [from, to] of replacements) if (title.length > 80) title = title.replace(from, to);
  return title.slice(0, 80).trim();
}
function sum(values, key) { return values.reduce((total, value) => total + Number(value[key] ?? 0), 0); }
function toCsv(data) {
  const fields = ["sku","game","name","set","setCode","number","year","language","rarity","finish","condition","artist","scryfallId","market","price","pricingBasis","title","description","frontImage","backImage","box","status"];
  return [fields, ...data.map((row) => fields.map((field) => row[field] ?? ""))].map((record) => record.map(csvCell).join(",")).join("\n") + "\n";
}
function csvCell(value) { const text = String(value); return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
