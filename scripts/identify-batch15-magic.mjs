#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const batch = join(root, "inventory/Batch 15 - Magic - PA-1354-PA-1452");
const imageDir = join(batch, "02 Listing Images");
const reviewDir = join(root, "outputs/batch15_magic_review");
const ocrPath = join(reviewDir, "ocr.jsonl");
const outputPath = join(reviewDir, "identifications.json");
const cacheDir = join(reviewDir, "scryfall-images");
await mkdir(cacheDir, { recursive: true });

const frontFiles = (await readdir(imageDir))
  .filter((name) => /^PA-\d{4}_front\.jpg$/i.test(name))
  .sort();
if (frontFiles.length !== 99 || frontFiles[0] !== "PA-1354_front.jpg" || frontFiles.at(-1) !== "PA-1452_front.jpg") {
  throw new Error(`Safety stop: expected PA-1354 through PA-1452 (99 fronts), found ${frontFiles.length}.`);
}

const refreshOcr = process.argv.includes("--refresh-ocr");
let ocrRows;
try {
  if (refreshOcr) throw new Error("OCR refresh requested");
  ocrRows = (await readFile(ocrPath, "utf8")).trim().split("\n").filter(Boolean).map(JSON.parse);
} catch {
  const { stdout } = await execFileAsync("swift", [
    join(root, "scripts/ocr-card-fronts.swift"),
    ...frontFiles.map((name) => join(imageDir, name)),
  ], { maxBuffer: 25 * 1024 * 1024 });
  await writeFile(ocrPath, stdout.trim() + "\n");
  ocrRows = stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

const results = [];
for (let index = 0; index < ocrRows.length; index += 1) {
  const row = ocrRows[index];
  const sku = row.file.match(/^(PA-\d{4})_front/i)?.[1];
  const observed = extractObserved(row.lines);
  const prints = await fetchPrints(observed);
  const candidates = narrowCandidates(prints, observed);
  const ranked = [];
  for (const card of candidates.slice(0, 80)) {
    const imageUrl = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal;
    if (!imageUrl) continue;
    const imagePath = join(cacheDir, `${card.id}.jpg`);
    let bytes;
    try { bytes = await readFile(imagePath); }
    catch {
      const response = await fetchWithRetry(imageUrl);
      if (!response.ok) continue;
      bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(imagePath, bytes);
      await delay(100);
    }
    const score = await imageCorrelation(join(imageDir, row.file), bytes);
    ranked.push({
      id: card.id,
      name: card.name,
      set: card.set_name,
      setCode: card.set,
      collectorNumber: card.collector_number,
      releasedAt: card.released_at,
      rarity: card.rarity,
      artist: card.artist,
      finishes: card.finishes,
      prices: card.prices,
      score,
    });
  }
  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  results.push({ sku, file: row.file, observed, best, alternatives: ranked.slice(1, 4) });
  await writeFile(outputPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`[${index + 1}/99] ${sku}: ${observed.name} -> ${best?.set ?? "NO MATCH"} ${best?.collectorNumber ?? ""} (${best?.score?.toFixed(4) ?? "n/a"})`);
}

await writeFile(outputPath, JSON.stringify(results, null, 2) + "\n");
const low = results.filter((row) => !row.best || row.best.score < 0.72);
console.log(`Identified ${results.length - low.length}/99 with strong visual confidence; ${low.length} require review.`);
if (low.length) console.log(low.map((row) => `${row.sku}:${row.observed.name}:${row.best?.score?.toFixed(3) ?? "none"}`).join("\n"));

function extractObserved(lines) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  const name = clean[0] ?? "";
  const joined = clean.join(" | ");
  const fraction = joined.match(/\b(\d{1,4}[a-z]?)\s*\/\s*(\d{2,4})\b/i);
  const copyrightYears = [...joined.matchAll(/(?:©|\b)(19\d{2}|20\d{2})\b/g)].map((match) => Number(match[1]));
  const artistLine = clean.find((line) => /Illus\.?/i.test(line)) ?? "";
  const artist = artistLine.replace(/^.*?Illus\.?\s*/i, "").trim();
  let collectorNumber = fraction?.[1] ?? "";
  if (!collectorNumber) {
    const possible = clean.slice(0, 3).join(" ").match(/(?:Coast|Inc\.?|™|©)\s+(\d{1,4}[a-z]?)\b/i);
    collectorNumber = possible?.[1] ?? "";
  }
  return { name, collectorNumber, printedTotal: fraction?.[2] ?? "", artist, copyrightYears, lines: clean };
}

async function fetchPrints(observed) {
  const { name } = observed;
  let canonicalName = name;
  const named = new URL("https://api.scryfall.com/cards/named");
  named.searchParams.set("exact", name);
  const namedResponse = await fetchWithRetry(named);
  if (namedResponse.ok) {
    canonicalName = (await namedResponse.json()).name;
  } else {
    named.searchParams.delete("exact");
    named.searchParams.set("fuzzy", name);
    const fuzzyResponse = await fetchWithRetry(named);
    if (fuzzyResponse.ok) canonicalName = (await fuzzyResponse.json()).name;
  }
  await delay(150);
  const base = `!\"${canonicalName.replaceAll('"', '')}\"`;
  const year = observed.copyrightYears.at(-1);
  const queries = [
    [base, observed.collectorNumber ? `cn:${observed.collectorNumber}` : "", year ? `year:${year}` : ""],
    [base, observed.collectorNumber ? `cn:${observed.collectorNumber}` : ""],
    [base, year ? `year:${year}` : ""],
    [base],
  ].map((parts) => parts.filter(Boolean).join(" "));
  for (const query of [...new Set(queries)]) {
    let url = new URL("https://api.scryfall.com/cards/search");
    url.searchParams.set("q", query);
    url.searchParams.set("unique", "prints");
    url.searchParams.set("order", "released");
    const cards = [];
    while (url && cards.length < 200) {
      const response = await fetchWithRetry(url);
      if (!response.ok) break;
      const body = await response.json();
      cards.push(...(body.data ?? []));
      url = body.has_more ? new URL(body.next_page) : null;
      await delay(150);
    }
    if (cards.length) return cards;
  }
  return [];
}

function narrowCandidates(cards, observed) {
  let result = cards.filter((card) => card.lang === "en" && !card.digital);
  if (observed.collectorNumber) {
    const exact = result.filter((card) => normalizeCollector(card.collector_number) === normalizeCollector(observed.collectorNumber));
    if (exact.length) result = exact;
  }
  if (observed.printedTotal) {
    const byTotal = result.filter((card) => String(card.printed_size ?? card.cardmarket_id ?? "") === observed.printedTotal);
    if (byTotal.length) result = byTotal;
  }
  if (observed.artist) {
    const artistNeedle = normalize(observed.artist);
    const byArtist = result.filter((card) => normalize(card.artist ?? "").includes(artistNeedle) || artistNeedle.includes(normalize(card.artist ?? "")));
    if (byArtist.length) result = byArtist;
  }
  if (observed.copyrightYears.length) {
    const years = new Set(observed.copyrightYears);
    const byYear = result.filter((card) => years.has(Number(card.released_at?.slice(0, 4))));
    if (byYear.length) result = byYear;
  }
  return result;
}

async function imageCorrelation(scanPath, referenceBytes) {
  const [scan, reference] = await Promise.all([
    normalizedPixels(scanPath),
    normalizedPixels(referenceBytes),
  ]);
  let sumA = 0; let sumB = 0;
  for (let i = 0; i < scan.length; i += 1) { sumA += scan[i]; sumB += reference[i]; }
  const meanA = sumA / scan.length; const meanB = sumB / reference.length;
  let covariance = 0; let varianceA = 0; let varianceB = 0;
  for (let i = 0; i < scan.length; i += 1) {
    const a = scan[i] - meanA; const b = reference[i] - meanB;
    covariance += a * b; varianceA += a * a; varianceB += b * b;
  }
  return covariance / Math.sqrt(varianceA * varianceB || 1);
}

async function normalizedPixels(input) {
  const { data } = await sharp(input)
    .resize(192, 268, { fit: "fill" })
    .grayscale()
    .normalise()
    .blur(0.6)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

function normalize(value) { return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function normalizeCollector(value) { return String(value).toLowerCase().replace(/^0+(?=\d)/, "").replace(/[^a-z0-9]/g, ""); }
function delay(ms) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }
async function fetchWithRetry(url, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "PocketArchivesInventory/1.0 contact@pocketarchives.com" } });
    if (response.status !== 429 || attempt === attempts) return response;
    await delay(1000 * attempt);
  }
}
