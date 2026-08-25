#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const batch = join(root, "inventory/Batch 23 - Pokemon Box 1 - PA-3649-PA-3996");
const review = join(batch, "03 Identification Review");
const listing = join(batch, "02 Listing Images");
const data = join(root, "data/reference/pokemon-tcg-data");
const ocrRows = (await readFile(join(review, "Batch 23 OCR.jsonl"), "utf8"))
  .trim().split("\n").map(JSON.parse);
if (ocrRows.length !== 348) throw new Error(`Safety stop: expected 348 OCR rows, found ${ocrRows.length}.`);

const sets = JSON.parse(await readFile(join(data, "sets/en.json"), "utf8"));
const setById = new Map(sets.map((set) => [set.id, set]));
const cards = [];
for (const file of (await readdir(join(data, "cards/en"))).filter((name) => name.endsWith(".json"))) {
  const set = setById.get(basename(file, ".json"));
  if (!set) continue;
  for (const card of JSON.parse(await readFile(join(data, "cards/en", file), "utf8"))) cards.push({ ...card, set });
}

const matches = ocrRows.map(matchRow);
await writeFile(join(review, "Batch 23 Catalog Matches.json"), `${JSON.stringify(matches, null, 2)}\n`);

const rows = matches.map((result) => {
  const accepted = result.confidence === "high" || result.confidence === "medium";
  const match = accepted ? result.match : null;
  const sku = result.sku;
  return {
    sku,
    game: "Pokemon",
    name: match?.name ?? "Identification pending",
    set: match?.set ?? "Identification pending",
    number: match ? `${match.number}/${match.printedTotal}` : result.printedNumber,
    year: match ? Number(match.releaseDate.slice(0, 4)) : "",
    language: match ? "English" : "",
    rarity: match?.rarity ?? "",
    finish: "Non-Holo",
    condition: "Review pending",
    price: "",
    frontImage: join(listing, `${sku}_front.jpg`),
    backImage: join(listing, `${sku}_back.jpg`),
    inventoryLocation: "Box 1",
    identificationConfidence: result.confidence,
    catalogId: match?.id ?? "",
    status: match
      ? "LOCAL ONLY - CONDITION AND PRICING PENDING"
      : "LOCAL ONLY - IDENTIFICATION, CONDITION, AND PRICING PENDING",
  };
});
await writeFile(join(batch, "Batch 23 Manifest.csv"), toCsv(rows, [
  "sku", "game", "name", "set", "number", "year", "language", "rarity", "finish", "condition", "price", "frontImage", "backImage", "inventoryLocation", "identificationConfidence", "catalogId", "status",
]));

const counts = Object.groupBy(matches, (row) => row.confidence);
console.log(JSON.stringify(Object.fromEntries(Object.entries(counts).map(([key, values]) => [key, values.length])), null, 2));

function matchRow(row) {
  const sku = row.file.slice(0, 7);
  const originalText = row.lines.join(" ");
  const normalizedText = normalize(originalText);
  const printed = extractPrintedNumber(originalText);
  let candidates = cards;
  if (printed) {
    candidates = cards.filter((card) =>
      normalizeCardNumber(card.number) === normalizeCardNumber(printed.numerator)
      && Number(card.set.printedTotal) === Number(printed.denominator));
  }
  const ranked = candidates
    .map((card) => ({ card, score: scoreCard(card, normalizedText, originalText, Boolean(printed)) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const second = ranked[1];
  const margin = best ? best.score - (second?.score ?? 0) : 0;
  let confidence = "unmatched";
  if (best && best.score >= 80 && margin >= 20) confidence = "high";
  else if (best && best.score >= 55 && margin >= 12) confidence = "medium";
  else if (best) confidence = "low";
  return {
    sku,
    file: row.file,
    printedNumber: printed ? `${printed.numerator}/${printed.denominator}` : "",
    ocrLines: row.lines,
    confidence,
    score: best?.score ?? 0,
    margin,
    match: best ? {
      id: best.card.id,
      name: best.card.name,
      set: best.card.set.name,
      number: best.card.number,
      printedTotal: best.card.set.printedTotal,
      releaseDate: best.card.set.releaseDate,
      rarity: best.card.rarity ?? "",
      artist: best.card.artist ?? "",
    } : null,
    alternatives: ranked.slice(1, 4).map((entry) => ({
      id: entry.card.id,
      name: entry.card.name,
      set: entry.card.set.name,
      score: entry.score,
    })),
  };
}

function scoreCard(card, normalizedText, originalText, hasPrintedNumber) {
  let score = hasPrintedNumber ? 35 : 0;
  const normalizedName = normalize(card.name);
  if (normalizedName && normalizedText.includes(normalizedName)) score += 70;
  else score += words(normalizedName).filter((word) => normalizedText.includes(word)).length * 12;
  const artist = normalize(card.artist ?? "");
  if (artist && normalizedText.includes(artist)) score += 25;
  if (card.hp && new RegExp(`(?:hp\\s*${card.hp}\\b|\\b${card.hp}\\s*hp)`, "i").test(originalText)) score += 18;
  for (const attack of card.attacks ?? []) {
    const attackName = normalize(attack.name);
    if (attackName && normalizedText.includes(attackName)) score += 18;
  }
  for (const ability of card.abilities ?? []) {
    const abilityName = normalize(ability.name);
    if (abilityName && normalizedText.includes(abilityName)) score += 18;
  }
  const flavorWords = words(normalize(card.flavorText ?? "")).filter((word) => word.length >= 6);
  score += Math.min(20, flavorWords.filter((word) => normalizedText.includes(word)).length * 2);
  return score;
}

function extractPrintedNumber(text) {
  const match = text.match(/\b(\d{1,3})\s*\/\s*(\d{2,3})\b/);
  return match ? { numerator: match[1], denominator: match[2] } : null;
}

function normalizeCardNumber(value) {
  return String(value).replace(/^0+(?=\d)/, "").toLowerCase();
}

function normalize(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function words(value) {
  return value.split(" ").filter((word) => word.length >= 3);
}

function toCsv(dataRows, fields) {
  return [fields, ...dataRows.map((row) => fields.map((field) => row[field] ?? ""))]
    .map((record) => record.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
