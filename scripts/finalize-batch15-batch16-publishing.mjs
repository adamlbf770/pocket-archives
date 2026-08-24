#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const activePath = resolve(root, "data/ebay/active-listings.json");
const manifests = [
  resolve(root, "inventory/Batch 15 - Magic - PA-1354-PA-1452/Batch 15 Manifest.csv"),
  resolve(root, "inventory/Batch 16 - Pokemon - PA-1453-PA-1454/Batch 16 Manifest.csv"),
];

const active = JSON.parse(await readFile(activePath, "utf8")).activeListings;
const activeBySku = new Map(active.filter((listing) => listing.sku).map((listing) => [listing.sku, listing]));

for (const manifestPath of manifests) {
  const rows = parseCsv(await readFile(manifestPath, "utf8"));
  const fields = [...Object.keys(rows[0])];
  for (const field of ["ebayStatus", "ebayListingId", "ebayUrl", "publishedAt"]) {
    if (!fields.includes(field)) fields.push(field);
  }

  for (const row of rows) {
    const listing = activeBySku.get(row.sku);
    if (!listing) throw new Error(`Safety stop: ${row.sku} is not active on eBay.`);
    row.status = row.status !== undefined ? "PUBLISHED" : row.status;
    row.ebayStatus = "PUBLISHED";
    row.ebayListingId = listing.itemId;
    row.ebayUrl = listing.viewItemUrl;
    row.publishedAt = listing.startTime;
  }

  await writeFile(manifestPath, toCsv(rows, fields));
  console.log(`Finalized ${rows.length} published rows in ${manifestPath.replace(`${root}/`, "")}.`);
}

function parseCsv(text) {
  const records = [];
  let record = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') {
      field += '"'; index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (!quoted && character === ",") { record.push(field); field = ""; }
    else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field); field = "";
      if (record.some((value) => value !== "")) records.push(record);
      record = [];
    } else field += character;
  }
  if (field || record.length) { record.push(field); records.push(record); }
  const [headers, ...values] = records;
  return values.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
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
