import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const args = process.argv.slice(2);
const fileArg = flagValue("--file") ?? args.find((value) => !value.startsWith("--"));
if (!fileArg) throw new Error("Use: npm run deals:import-comps -- --file path/to/export.csv [--apply]");

const inputPath = resolve(fileArg);
const destination = resolve(root, "data/deals/sold-comps.json");
const imported = extname(inputPath).toLowerCase() === ".json"
  ? normalizeJson(JSON.parse(await readFile(inputPath, "utf8")))
  : normalizeCsv(await readFile(inputPath, "utf8"));
const existing = JSON.parse(await readFile(destination, "utf8"));
const merged = deduplicate([...(existing.sales ?? []), ...imported]);

console.log(JSON.stringify({ input: inputPath, validSales: imported.length, duplicatesRemoved: existing.sales.length + imported.length - merged.length, totalAfterImport: merged.length, applied: args.includes("--apply") }, null, 2));
if (args.includes("--apply")) {
  await writeFile(destination, `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "Imported realized sales", sales: merged }, null, 2)}\n`);
}

function normalizeJson(value) { return (Array.isArray(value) ? value : value.sales ?? []).map(normalizeSale).filter(Boolean); }
function normalizeCsv(text) {
  const rows = parseCsv(text);
  const headers = rows.shift()?.map(normalizeHeader) ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))).map((row) => normalizeSale({ title: first(row, "title", "itemtitle", "listingtitle"), soldPrice: money(first(row, "soldprice", "saleprice", "price", "totalprice")), shipping: money(first(row, "shipping", "shippingprice", "delivery")), soldAt: first(row, "solddate", "saledate", "date", "ended"), source: first(row, "source") || "eBay Product Research export", sourceUrl: first(row, "url", "itemurl", "listingurl") })).filter(Boolean);
}
function normalizeSale(value) {
  const title = String(value?.title ?? "").trim();
  const soldPrice = Number(value?.soldPrice);
  const soldAt = new Date(value?.soldAt);
  if (!title || !(soldPrice > 0) || !Number.isFinite(soldAt.getTime())) return null;
  return { title, soldPrice: round(soldPrice), shipping: round(Math.max(0, Number(value.shipping ?? 0))), soldAt: soldAt.toISOString(), source: String(value.source ?? "Imported realized sales"), sourceUrl: String(value.sourceUrl ?? ""), rawNmValue: nullableNumber(value.rawNmValue), population: nullableNumber(value.population) };
}
function deduplicate(values) { const seen = new Set(); return values.filter((value) => { const key = `${value.title.toLowerCase()}|${value.soldPrice}|${value.shipping}|${value.soldAt}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
function parseCsv(text) { const rows = []; let row = [], value = "", quoted = false; for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { row.push(value); value = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(value); if (row.some((cell) => cell.trim())) rows.push(row); row = []; value = ""; } else value += char; } row.push(value); if (row.some((cell) => cell.trim())) rows.push(row); return rows; }
function normalizeHeader(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function first(row, ...keys) { return keys.map((key) => row[key]).find((value) => value !== undefined && value !== "") ?? ""; }
function money(value) { const cleaned = String(value ?? "").replace(/[^0-9.-]/g, ""); return Number(cleaned || 0); }
function nullableNumber(value) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; }
function flagValue(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function round(value) { return Math.round(value * 100) / 100; }
