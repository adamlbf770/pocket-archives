#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ACTIVE_PATH = path.join(ROOT, "data/ebay/active-listings.json");
const OUTPUT_DIR = path.join(ROOT, "outputs/ebay-active-orientation-audit");
const WORKERS = 6;
const CHUNK_SIZE = 80;
const active = JSON.parse(await readFile(ACTIVE_PATH, "utf8")).activeListings ?? [];
const activeBySku = new Map(active.filter((row) => row.sku).map((row) => [row.sku, row]));
const records = await loadManifestRecords();
const targets = [];

for (const [sku, listing] of activeBySku) {
  const record = records.get(sku);
  if (!record) continue;
  const front = await resolveImage(record.frontImage, record.manifestDir, sku, "front");
  if (front) targets.push({ sku, itemId: listing.itemId, title: listing.title, front });
}

await mkdir(OUTPUT_DIR, { recursive: true });
const chunks = [];
for (let index = 0; index < targets.length; index += CHUNK_SIZE) chunks.push(targets.slice(index, index + CHUNK_SIZE));
let completed = 0;
const results = [];
await mapLimit(chunks, WORKERS, async (chunk) => {
  results.push(...await runSwift(chunk.map((row) => row.front)));
  completed += chunk.length;
  console.log(`OCR ${Math.min(completed, targets.length)}/${targets.length}`);
});

const byPath = new Map(results.map((row) => [row.file, row]));
const audited = targets.map((target) => {
  const result = byPath.get(target.front);
  const rawRotation = Number(result?.correctionRotation ?? 0);
  const exifRotation = exifOrientationRotation(result?.exifOrientation);
  const displayCorrection = result?.decision === "UNCERTAIN" ? null : (rawRotation - exifRotation + 360) % 360;
  return {
    ...target,
    decision: result?.decision ?? "UNCERTAIN",
    rawRotation,
    exifOrientation: Number(result?.exifOrientation ?? 1),
    exifRotation,
    rotation: displayCorrection,
    scoreMargin: result?.decision === "INVERTED"
      ? Math.abs((result?.invertedScore ?? 0) - (result?.uprightScore ?? 0))
      : Math.abs((result?.clockwiseScore ?? 0) - (result?.counterclockwiseScore ?? 0)),
    uprightScore: result?.uprightScore ?? 0,
    invertedScore: result?.invertedScore ?? 0,
    landmarks: result?.landmarks ?? [],
  };
});
const candidates = audited.filter((row) => row.rotation !== null && row.rotation !== 0);
await writeFile(path.join(OUTPUT_DIR, "audit.json"), `${JSON.stringify({ auditedAt: new Date().toISOString(), active: active.length, matched: targets.length, audited }, null, 2)}\n`);
await writeFile(path.join(OUTPUT_DIR, "candidates.json"), `${JSON.stringify(candidates, null, 2)}\n`);
await writeFile(path.join(OUTPUT_DIR, "candidate-skus.txt"), `${candidates.map((row) => row.sku).join("\n")}${candidates.length ? "\n" : ""}`);
console.log(JSON.stringify({ active: active.length, manifestMatched: targets.length, candidates: candidates.length, output: OUTPUT_DIR }, null, 2));

async function loadManifestRecords() {
  const inventoryDir = path.join(ROOT, "inventory");
  const records = new Map();
  for (const entry of await readdir(inventoryDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("Batch ")) continue;
    const manifestDir = path.join(inventoryDir, entry.name);
    const manifestName = (await readdir(manifestDir)).find((name) => /manifest\.csv$/i.test(name));
    if (!manifestName) continue;
    for (const source of parseCsv(await readFile(path.join(manifestDir, manifestName), "utf8"))) {
      const sku = source.sku || source.SKU || source.ID || "";
      if (!sku) continue;
      records.set(sku, { sku, frontImage: source.frontImage || source["Front Image"] || source["Front Image Path"] || source.front || "", manifestDir });
    }
  }
  return records;
}

async function resolveImage(value, manifestDir, sku, side) {
  const candidates = [];
  if (value) {
    candidates.push(path.isAbsolute(value) ? value : path.join(manifestDir, value));
    candidates.push(path.join(ROOT, value));
  }
  const listingDir = path.join(manifestDir, "02 Listing Images");
  try {
    for (const name of await readdir(listingDir)) {
      if (name.toLowerCase().startsWith(`${sku.toLowerCase()}_`) && name.toLowerCase().includes(side)) candidates.push(path.join(listingDir, name));
    }
  } catch {}
  for (const candidate of candidates) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch {}
  }
  return null;
}

async function runSwift(files) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("swift", [path.join(ROOT, "scripts/ocr-card-landmark-orientation.swift"), ...files], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (piece) => { stdout += piece; });
    child.stderr.on("data", (piece) => { stderr += piece; });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) return reject(new Error(`orientation worker failed ${code}: ${stderr.slice(0, 1000)}`));
      try { resolvePromise(stdout.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)); }
      catch (error) { reject(error); }
    });
  });
}

async function mapLimit(values, concurrency, worker) {
  let cursor = 0;
  async function run() { while (cursor < values.length) { const index = cursor; cursor += 1; await worker(values[index]); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, run));
}

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (char !== "\r") field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function exifOrientationRotation(value) {
  return ({ 1: 0, 3: 180, 6: 90, 8: 270 })[Number(value)] ?? 0;
}
