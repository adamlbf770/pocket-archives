#!/usr/bin/env node

import { copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { validAccessToken } from "./api.mjs";
import { analyzeOrientation } from "../ingestion/orientation.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const side = stringArg("--side") === "back" ? "back" : "front";
const imageIndex = side === "back" ? 1 : 0;
const otherImageIndex = imageIndex === 0 ? 1 : 0;
const AUDIT_DIR = path.join(ROOT, side === "back" ? "outputs/ebay-active-back-orientation-audit" : "outputs/ebay-active-orientation-audit");
const CANDIDATES_PATH = path.join(AUDIT_DIR, "candidates.json");
const WORK_DIR = path.join(AUDIT_DIR, "repairs");
const PREVIEW_DIR = path.join(WORK_DIR, "previews");
const BACKUP_DIR = path.join(WORK_DIR, "originals");
const STATE_PATH = path.join(WORK_DIR, "state.json");
const ATTACHMENTS_PATH = path.join(ROOT, "data/ebay/image-attachments.json");
const UPLOADS_PATH = path.join(ROOT, "data/ebay/image-uploads.json");
const apply = process.argv.includes("--apply");
const limit = numberArg("--limit", Number.POSITIVE_INFINITY);
const requested = stringArg("--sku");
const requestedFile = stringArg("--sku-file");
const sourceImage = stringArg("--source-image");
const requestedSkus = new Set([
  ...(requested ? [requested] : []),
  ...(requestedFile ? (await readFile(requestedFile, "utf8")).split(/\r?\n/).map((value) => value.trim()).filter(Boolean) : []),
]);
const approveManualReview = process.argv.includes("--approve-manual-review");
const requestedRotation = numberArg("--rotation", Number.NaN);
const prepareConcurrency = numberArg("--prepare-concurrency", 6);
const applyConcurrency = numberArg("--apply-concurrency", 3);

const allCandidates = JSON.parse(await readFile(CANDIDATES_PATH, "utf8"));
if (requested && sourceImage && !allCandidates.some((row) => row.sku === requested)) {
  const active = JSON.parse(await readFile(path.join(ROOT, "data/ebay/active-listings.json"), "utf8")).activeListings ?? [];
  const listing = active.find((row) => row.sku === requested);
  if (!listing) throw new Error(`${requested}: active listing not found for explicit source image repair`);
  allCandidates.push({ sku: requested, itemId: listing.itemId, title: listing.title, front: path.resolve(sourceImage), rotation: requestedRotation, scoreMargin: 0 });
}
const state = await readJson(STATE_PATH, { applied: {}, failed: {}, previewReview: {} });
state.previewReview ??= {};
const candidates = allCandidates
  .filter((row) => Number(row.scoreMargin) >= 6 || requestedSkus.has(row.sku))
  .filter((row) => Number(row.rotation) === 180 || (requestedSkus.has(row.sku) && Number.isFinite(requestedRotation)))
  .filter((row) => !requestedSkus.size || requestedSkus.has(row.sku))
  .filter((row) => !state.applied[row.sku])
  .slice(0, limit);

await Promise.all([mkdir(PREVIEW_DIR, { recursive: true }), mkdir(BACKUP_DIR, { recursive: true })]);
const prepared = [];
const previewReview = [];
let preparedCount = 0;
await mapLimit(candidates, prepareConcurrency, async (row) => {
  try {
    const rotation = Number.isFinite(requestedRotation) && requestedSkus.has(row.sku) ? requestedRotation : Number(row.rotation);
    const preview = path.join(PREVIEW_DIR, `${row.sku}-${side}-upright.jpg`);
    await sharp(row.front)
      .rotate()
      .rotate(rotation)
      .flatten({ background: "#ffffff" })
      .withMetadata({ orientation: 1 })
      .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
      .toFile(preview);
    const check = await analyzeOrientation(preview, { root: ROOT });
    if ((check.decision !== "UPRIGHT" || check.rotation !== 0) && !(approveManualReview && requestedSkus.has(row.sku))) {
      throw new Error(`corrected preview did not independently certify upright (${check.decision}, ${check.confidence})`);
    }
    prepared.push({ ...row, preview });
    if (approveManualReview && requestedSkus.has(row.sku)) {
      state.manualApprovals ??= {};
      state.manualApprovals[row.sku] = { approvedAt: new Date().toISOString(), reason: "Corrected preview visually verified upright" };
    }
    delete state.previewReview[row.sku];
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    state.previewReview[row.sku] = { reviewedAt: new Date().toISOString(), reason };
    previewReview.push({ sku: row.sku, reason });
  }
  preparedCount += 1;
  if (preparedCount % 25 === 0 || preparedCount === candidates.length) console.log(`Prepared and certified ${preparedCount}/${candidates.length}`);
});
prepared.sort((left, right) => left.sku.localeCompare(right.sku, undefined, { numeric: true }));
await writeJsonAtomic(STATE_PATH, state);

console.log(JSON.stringify({ mode: apply ? "apply" : "preflight", remainingStrongCandidates: allCandidates.filter((row) => Number(row.scoreMargin) >= 6 && Number(row.rotation) === 180 && !state.applied[row.sku]).length, selected: prepared.length, previewReview: previewReview.length, previewReviewSkus: previewReview.map((row) => row.sku), skus: prepared.map((row) => row.sku) }, null, 2));
if (!apply || !prepared.length) process.exit(0);

const token = await validAccessToken();
const attachments = await readJson(ATTACHMENTS_PATH, {});
const uploads = await readJson(UPLOADS_PATH, {});
let completed = 0;
let persistChain = Promise.resolve();
const failures = [];

await mapLimit(prepared, applyConcurrency, async (row) => {
  try {
    const current = await inventoryRequest(row.sku, token);
    const oldUrls = current?.product?.imageUrls ?? [];
    if (oldUrls.length < 2) throw new Error("current front/back image pair is incomplete");
    const currentTitle = String(current?.product?.title ?? "");
    if (currentTitle !== row.title) throw new Error(`title changed since audit: ${currentTitle}`);

    const newUrl = await uploadPicture(row.preview, row.sku, token, side);
    const payload = writableInventoryPayload(current);
    const nextUrls = [...oldUrls];
    nextUrls[imageIndex] = newUrl;
    payload.product = { ...payload.product, imageUrls: nextUrls };
    let updateMethod = "Inventory API";
    try {
      await inventoryRequest(row.sku, token, { method: "PUT", body: JSON.stringify(payload) });
    } catch (error) {
      if (!String(error).includes('"errorId":25604')) throw error;
      updateMethod = "Trading API availability fallback";
      await reviseListingPictures(row.itemId, nextUrls, token);
    }
    const verified = updateMethod === "Inventory API"
      ? await inventoryRequest(row.sku, token)
      : await getPublicListing(row.itemId, token);
    const verifiedUrls = updateMethod === "Inventory API" ? verified?.product?.imageUrls : verified.imageUrls;
    const verifiedTitle = updateMethod === "Inventory API" ? verified?.product?.title : verified.title;
    if (verifiedUrls?.[imageIndex] !== newUrl) throw new Error(`new ${side} URL did not persist`);
    if (verifiedUrls?.[otherImageIndex] !== oldUrls[otherImageIndex]) throw new Error(`${side === "front" ? "back" : "front"} image changed unexpectedly`);
    if (verifiedTitle !== currentTitle) throw new Error("title changed unexpectedly");

    const backup = path.join(BACKUP_DIR, `${row.sku}-${side}-original${path.extname(row.front) || ".jpg"}`);
    try { await stat(backup); } catch { await copyFile(row.front, backup); }
    const temporary = `${row.front}.upright-${process.pid}.tmp.jpg`;
    await copyFile(row.preview, temporary);
    await rename(temporary, row.front);

    const relative = path.relative(ROOT, row.front);
    const appliedAt = new Date().toISOString();
    uploads[relative] = { url: newUrl, uploadedAt: appliedAt, reason: "Active orientation audit repair" };
    attachments[row.sku] = { imageCount: verifiedUrls.length, imageUrls: verifiedUrls, attachedAt: appliedAt, reason: "Active orientation audit repair" };
    state.applied[row.sku] = { appliedAt, itemId: row.itemId, title: currentTitle, side, oldImageUrl: oldUrls[imageIndex], newImageUrl: newUrl, retainedOtherUrl: oldUrls[otherImageIndex], localImage: row.front, backup, updateMethod };
    delete state.failed[row.sku];
    await queuePersist();
    completed += 1;
    if (completed % 10 === 0 || completed === prepared.length) console.log(`[${completed}/${prepared.length}] Corrected and verified through ${row.sku}`);
  } catch (error) {
    state.failed[row.sku] = { failedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
    failures.push({ sku: row.sku, error: state.failed[row.sku].error });
    await queuePersist();
    console.error(`${row.sku}: skipped safely: ${state.failed[row.sku].error}`);
  }
});
await persistChain;

console.log(JSON.stringify({ corrected: completed, failed: failures.length, failures, remaining: allCandidates.filter((row) => Number(row.scoreMargin) >= 6 && Number(row.rotation) === 180 && !state.applied[row.sku]).length, state: STATE_PATH }, null, 2));

function queuePersist() {
  persistChain = persistChain.then(() => persistState(state, attachments, uploads));
  return persistChain;
}

function writableInventoryPayload(current) {
  const payload = structuredClone(current);
  delete payload.sku;
  delete payload.locale;
  delete payload.availability?.shipToLocationAvailability?.allocationByFormat;
  delete payload.packageWeightAndSize?.shippingIrregular;
  return payload;
}

async function persistState(nextState, attachments, uploads) {
  await Promise.all([
    writeJsonAtomic(STATE_PATH, nextState),
    writeJsonAtomic(ATTACHMENTS_PATH, attachments),
    writeJsonAtomic(UPLOADS_PATH, uploads),
  ]);
}

async function writeJsonAtomic(target, value) {
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, target);
}

async function readJson(target, fallback) {
  try { return JSON.parse(await readFile(target, "utf8")); } catch { return fallback; }
}

async function inventoryRequest(sku, accessToken, options = {}) {
  const response = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    ...options,
    headers: { Accept: "application/json", "Accept-Language": "en-US", Authorization: `Bearer ${accessToken}`, "Content-Language": "en-US", "Content-Type": "application/json", "X-EBAY-C-MARKETPLACE-ID": "EBAY_US", ...options.headers },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Inventory ${options.method ?? "GET"} failed (${response.status}): ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : null;
}

async function uploadPicture(file, sku, accessToken, imageSide) {
  const xml = `<?xml version="1.0" encoding="utf-8"?><UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents"><RequesterCredentials><eBayAuthToken>${escapeXml(accessToken)}</eBayAuthToken></RequesterCredentials><PictureName>${escapeXml(`${sku}-audit-upright-${imageSide}`)}</PictureName><PictureSet>Supersize</PictureSet></UploadSiteHostedPicturesRequest>`;
  const form = new FormData();
  form.append("XML Payload", xml);
  form.append("Binary Data", new Blob([await readFile(file)], { type: "image/jpeg" }), path.basename(file));
  const response = await fetch("https://api.ebay.com/ws/api.dll", { method: "POST", headers: { "X-EBAY-API-CALL-NAME": "UploadSiteHostedPictures", "X-EBAY-API-COMPATIBILITY-LEVEL": "1455", "X-EBAY-API-RESPONSE-ENCODING": "XML", "X-EBAY-API-SITEID": "0" }, body: form });
  const body = await response.text();
  const ack = xmlValue(body, "Ack");
  const url = decodeXml(xmlValue(body, "FullURL"));
  if (!response.ok || !["Success", "Warning"].includes(ack) || !url) throw new Error(`picture upload failed: ${xmlValue(body, "LongMessage") || body.slice(0, 600)}`);
  return url;
}

async function reviseListingPictures(itemId, imageUrls, accessToken) {
  const pictures = imageUrls.map((url) => `<PictureURL>${escapeXml(url)}</PictureURL>`).join("");
  await tradingRequest("ReviseFixedPriceItem", `<Item><ItemID>${escapeXml(itemId)}</ItemID><PictureDetails>${pictures}</PictureDetails></Item>`, accessToken);
}

async function getPublicListing(itemId, accessToken) {
  const body = await tradingRequest("GetItem", `<ItemID>${escapeXml(itemId)}</ItemID><DetailLevel>ReturnAll</DetailLevel>`, accessToken);
  return {
    title: decodeXml(xmlValue(body, "Title")),
    imageUrls: [...body.matchAll(/<PictureURL(?:\s[^>]*)?>([\s\S]*?)<\/PictureURL>/gi)].map((match) => decodeXml(match[1].trim())),
  };
}

async function tradingRequest(callName, payload, accessToken) {
  const xml = `<?xml version="1.0" encoding="utf-8"?><${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents"><RequesterCredentials><eBayAuthToken>${escapeXml(accessToken)}</eBayAuthToken></RequesterCredentials>${payload}</${callName}Request>`;
  const response = await fetch("https://api.ebay.com/ws/api.dll", {
    method: "POST",
    headers: { "Content-Type": "text/xml", "X-EBAY-API-CALL-NAME": callName, "X-EBAY-API-COMPATIBILITY-LEVEL": "1455", "X-EBAY-API-SITEID": "0" },
    body: xml,
  });
  const body = await response.text();
  const ack = xmlValue(body, "Ack");
  if (!response.ok || !["Success", "Warning"].includes(ack)) throw new Error(`${callName} failed: ${decodeXml(xmlValue(body, "LongMessage")) || body.slice(0, 600)}`);
  return body;
}

function numberArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? Number(process.argv[index + 1]) : fallback;
}

function stringArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function xmlValue(xml, tag) { return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() ?? ""; }
function escapeXml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function decodeXml(value) { return String(value).replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'"); }

async function mapLimit(values, concurrency, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, run));
}
