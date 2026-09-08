#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ebayRequest, validAccessToken } from "./api.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const backMode = process.argv.includes("--back");
const OUTPUT_DIR = path.join(ROOT, backMode ? "outputs/ebay-active-back-orientation-audit" : "outputs/ebay-active-orientation-audit");
const LIVE_DIR = path.join(OUTPUT_DIR, "live-fronts");
const missingMode = process.argv.includes("--missing-manifests");
const noSkuMode = process.argv.includes("--no-sku");
const lowConfidenceMode = process.argv.includes("--low-confidence");
const candidates = backMode
  ? JSON.parse(await readFile(path.join(OUTPUT_DIR, "candidates.json"), "utf8"))
  : noSkuMode
  ? JSON.parse(await readFile(path.join(ROOT, "data/ebay/active-listings.json"), "utf8")).activeListings.filter((row) => !row.sku)
  : missingMode
  ? JSON.parse(await readFile(path.join(ROOT, "outputs/ebay-active-audit/active-image-collision-audit.json"), "utf8")).missingManifest
  : lowConfidenceMode
  ? JSON.parse(await readFile(path.join(OUTPUT_DIR, "candidates.json"), "utf8")).filter((row) => Number(row.rotation) === 180 && Number(row.scoreMargin) < 6)
  : JSON.parse(await readFile(path.join(OUTPUT_DIR, "verified.json"), "utf8")).filter((row) => row.accurateRotation === 180);
await mkdir(LIVE_DIR, { recursive: true });

const rows = [];
for (const [index, candidate] of candidates.entries()) {
  let imageUrls;
  try {
    const item = await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(candidate.sku)}`);
    imageUrls = item?.product?.imageUrls ?? [];
  } catch (error) {
    if (!String(error).includes("(404)")) throw error;
    imageUrls = await tradingPictureUrls(candidate.itemId);
  }
  if (!imageUrls.length && candidate.itemId) imageUrls = await tradingPictureUrls(candidate.itemId);
  const url = imageUrls[backMode ? 1 : 0];
  if (!url) throw new Error(`${candidate.sku} has no live first image.`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${candidate.sku} image download failed (${response.status}).`);
  const key = candidate.sku || `ITEM-${candidate.itemId}`;
  const file = path.join(LIVE_DIR, `${key}.jpg`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  rows.push({ ...candidate, liveFront: file, liveUrl: url, imageUrls });
  console.log(`[${index + 1}/${candidates.length}] ${key}`);
}

async function tradingPictureUrls(itemId) {
  const token = await validAccessToken();
  const request = `<?xml version="1.0" encoding="utf-8"?><GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents"><RequesterCredentials><eBayAuthToken>${token.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</eBayAuthToken></RequesterCredentials><ItemID>${itemId}</ItemID><DetailLevel>ReturnAll</DetailLevel></GetItemRequest>`;
  const response = await fetch("https://api.ebay.com/ws/api.dll", { method: "POST", headers: { "Content-Type": "text/xml", "X-EBAY-API-CALL-NAME": "GetItem", "X-EBAY-API-COMPATIBILITY-LEVEL": "1455", "X-EBAY-API-SITEID": "0" }, body: request });
  const xml = await response.text();
  if (!response.ok || !/<Ack>(?:Success|Warning)<\/Ack>/i.test(xml)) throw new Error(`GetItem ${itemId} failed: ${xml.slice(0, 800)}`);
  return [...xml.matchAll(/<PictureURL>([\s\S]*?)<\/PictureURL>/gi)].map((match) => match[1].replaceAll("&amp;", "&"));
}

const prefix = backMode ? "live-back" : noSkuMode ? "live-no-sku" : missingMode ? "live-missing" : lowConfidenceMode ? "live-low-confidence" : "live";
await writeFile(path.join(OUTPUT_DIR, `${prefix}-review.json`), `${JSON.stringify(rows, null, 2)}\n`);
await makeSheet(rows, path.join(OUTPUT_DIR, `${prefix}-current.jpg`), 0);
await makeSheet(rows, path.join(OUTPUT_DIR, `${prefix}-rotated-preview.jpg`), 180);
console.log(JSON.stringify({ reviewed: rows.length, current: path.join(OUTPUT_DIR, `${prefix}-current.jpg`), rotated: path.join(OUTPUT_DIR, `${prefix}-rotated-preview.jpg`) }, null, 2));

async function makeSheet(page, output, rotation) {
  const cellWidth = 180; const cellHeight = 280; const columns = 10;
  const pageRows = Math.ceil(page.length / columns);
  const canvas = sharp({ create: { width: columns * cellWidth, height: pageRows * cellHeight, channels: 3, background: "#e9e5da" } });
  const composites = [];
  for (let index = 0; index < page.length; index += 1) {
    const row = page[index];
    let image = sharp(row.liveFront);
    if (rotation) image = image.rotate(rotation);
    const thumb = await image.resize({ width: 160, height: 230, fit: "contain", background: "#ffffff" }).jpeg({ quality: 86 }).toBuffer();
    const label = Buffer.from(`<svg width="180" height="40"><rect width="180" height="40" fill="#e9e5da"/><text x="90" y="24" font-family="Arial" font-size="13" text-anchor="middle" fill="#181815">${row.sku || row.itemId}</text></svg>`);
    const left = (index % columns) * cellWidth; const top = Math.floor(index / columns) * cellHeight;
    composites.push({ input: thumb, left: left + 10, top: top + 4 }, { input: label, left, top: top + 236 });
  }
  await canvas.composite(composites).jpeg({ quality: 88 }).toFile(output);
}
