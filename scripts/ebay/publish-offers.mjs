import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { ebayRequest } from "./api.mjs";
import { FREE_SHIPPING_THRESHOLD, TRACKED_SHIPPING_THRESHOLD } from "./core.mjs";
import { assertListingPublishSafe } from "./listing-integrity.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const DRAFTS_DIR = join(ROOT, "data/ebay/drafts");
const CONFIG_PATH = join(ROOT, "data/ebay/account-config.json");
const ATTACHMENTS_PATH = join(ROOT, "data/ebay/image-attachments.json");
const PUBLISH_LOG_PATH = join(ROOT, "data/ebay/published-offers.json");
const FAILURE_LOG_PATH = join(ROOT, "data/ebay/publish-failures.json");
const apply = process.argv.includes("--apply");
const skuFlag = process.argv.find((argument) => argument.startsWith("--sku="));
const requestedSku = skuFlag ? skuFlag.slice("--sku=".length) : null;
const fromFlag = process.argv.find((argument) => argument.startsWith("--from="));
const toFlag = process.argv.find((argument) => argument.startsWith("--to="));
const fromSku = fromFlag ? fromFlag.slice("--from=".length) : null;
const toSku = toFlag ? toFlag.slice("--to=".length) : null;
const limitFlag = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitFlag ? Number(limitFlag.split("=")[1]) : Number.POSITIVE_INFINITY;
if ((limit !== Number.POSITIVE_INFINITY && !Number.isInteger(limit)) || limit < 1) {
  throw new Error("--limit must be a positive integer.");
}

const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
const attachments = JSON.parse(await readFile(ATTACHMENTS_PATH, "utf8"));
const records = await loadOfferRecords();
const matchingRecords = records.filter((record) => {
  if (requestedSku) return record.sku === requestedSku;
  if (fromSku && skuNumber(record.sku) < skuNumber(fromSku)) return false;
  if (toSku && skuNumber(record.sku) > skuNumber(toSku)) return false;
  return true;
});
if (requestedSku && matchingRecords.length !== 1) throw new Error(`Offer SKU not found: ${requestedSku}`);
const selected = matchingRecords.slice(0, limit);
const audit = await auditOffers(selected);

console.log(`Preflight passed: ${selected.length} offers, ${audit.imageCount} images, $${audit.totalPrice.toFixed(2)} total list price.`);
console.log(`Status before publish: ${JSON.stringify(audit.statuses)}`);
if (!apply) {
  console.log("No listings were published. Run with --apply to publish this audited set.");
  process.exit(0);
}

const publishLog = await readJson(PUBLISH_LOG_PATH, {});
const failures = {};
let published = 0;
let skipped = 0;
let saveChain = Promise.resolve();

await mapLimit(selected, 3, async (record, index) => {
  try {
    const current = await retry(() =>
      ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(record.offerId)}`),
    );
    if (current.status === "PUBLISHED") {
      skipped += 1;
      const listingId = current.listing?.listingId ?? record.listingId;
      if (listingId && (!record.listingId || record.status !== "PUBLISHED")) {
        const publishedAt = record.publishedAt ?? new Date().toISOString();
        await saveJson(join(DRAFTS_DIR, `${safeFilename(record.sku)}.json`), {
          ...record,
          status: "PUBLISHED",
          listingId,
          publishedAt,
        });
        publishLog[record.sku] = { offerId: record.offerId, listingId, publishedAt };
        await queueSave(PUBLISH_LOG_PATH, publishLog);
      }
      console.log(`[${index + 1}/${selected.length}] Already published: ${record.sku}`);
      return;
    }
    if (current.status !== "UNPUBLISHED") {
      throw new Error(`Unexpected offer status ${current.status}`);
    }

    const result = await retry(() =>
      ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(record.offerId)}/publish`, {
        method: "POST",
      }),
    );
    const publishedAt = new Date().toISOString();
    const updatedRecord = {
      ...record,
      status: "PUBLISHED",
      listingId: result.listingId,
      publishedAt,
    };
    await saveJson(join(DRAFTS_DIR, `${safeFilename(record.sku)}.json`), updatedRecord);
    publishLog[record.sku] = {
      offerId: record.offerId,
      listingId: result.listingId,
      publishedAt,
    };
    await queueSave(PUBLISH_LOG_PATH, publishLog);
    published += 1;
    console.log(`[${index + 1}/${selected.length}] Published ${record.sku}: ${result.listingId}`);
  } catch (error) {
    failures[record.sku] = {
      offerId: record.offerId,
      error: error.message,
      failedAt: new Date().toISOString(),
    };
    await queueSave(FAILURE_LOG_PATH, failures);
    console.error(`[${index + 1}/${selected.length}] FAILED ${record.sku}: ${error.message}`);
  }
});
await saveChain;

if (Object.keys(failures).length === 0) {
  await saveJson(FAILURE_LOG_PATH, {});
}
console.log(`Publish run complete: ${published} newly published, ${skipped} already published, ${Object.keys(failures).length} failed.`);
if (Object.keys(failures).length) process.exitCode = 1;

async function loadOfferRecords() {
  const files = (await readdir(DRAFTS_DIR)).filter((name) => name.endsWith(".json"));
  const values = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(join(DRAFTS_DIR, file), "utf8"))),
  );
  if (values.some((record) => ["PA-0198", "PA-0199"].includes(record.sku))) {
    throw new Error("Safety stop: excluded Sliggoo or Zorua unexpectedly has an offer.");
  }
  return values.sort((left, right) => skuNumber(left.sku) - skuNumber(right.sku));
}

function skuNumber(sku) {
  const match = String(sku).match(/^PA-(\d+)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

async function auditOffers(offerRecords) {
  const results = await mapLimit(offerRecords, 6, async (record) => {
    const [offer, item] = await Promise.all([
      retry(() => ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(record.offerId)}`)),
      retry(() => ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(record.sku)}`)),
    ]);
    if (!["UNPUBLISHED", "PUBLISHED"].includes(offer.status)) {
      throw new Error(`${record.sku}: unexpected status ${offer.status}`);
    }
    if (offer.sku !== record.sku) throw new Error(`${record.sku}: offer SKU mismatch.`);
    if (offer.marketplaceId !== "EBAY_US") throw new Error(`${record.sku}: wrong marketplace.`);
    if (offer.format !== "FIXED_PRICE") throw new Error(`${record.sku}: offer is not fixed price.`);
    const expectedQuantity = Number(record.quantity ?? 1);
    if (Number(offer.availableQuantity) !== expectedQuantity) throw new Error(`${record.sku}: quantity is not ${expectedQuantity}.`);
    if (offer.merchantLocationKey !== config.merchantLocationKey) {
      throw new Error(`${record.sku}: wrong inventory location.`);
    }
    const price = Number(offer.pricingSummary?.price?.value);
    if (!Number.isFinite(price) || price <= 0) throw new Error(`${record.sku}: invalid price.`);
    const expectedFulfillmentPolicyId = record.shippingProfile === "TRACKED" || price >= TRACKED_SHIPPING_THRESHOLD
      ? config.trackedFulfillmentPolicyId
      : price >= FREE_SHIPPING_THRESHOLD
        ? config.freeFulfillmentPolicyId
      : config.fulfillmentPolicyId;
    if (offer.listingPolicies?.fulfillmentPolicyId !== expectedFulfillmentPolicyId) {
      throw new Error(`${record.sku}: wrong fulfillmentPolicyId.`);
    }
    for (const key of ["paymentPolicyId", "returnPolicyId"]) {
      if (offer.listingPolicies?.[key] !== config[key]) throw new Error(`${record.sku}: wrong ${key}.`);
    }
    if (!item.product?.title || !item.product?.description) {
      throw new Error(`${record.sku}: missing title or description.`);
    }
    const expectedImages = attachments[record.sku]?.imageCount;
    const imageCount = item.product?.imageUrls?.length ?? 0;
    if (!expectedImages || imageCount !== expectedImages) {
      throw new Error(`${record.sku}: expected ${expectedImages ?? "logged"} images, found ${imageCount}.`);
    }
    if (!item.condition) throw new Error(`${record.sku}: missing item condition data.`);
    if (offer.categoryId === "183454" && !item.conditionDescriptors?.length) {
      throw new Error(`${record.sku}: missing single-card condition data.`);
    }
    assertListingPublishSafe({ record, item, attachment: attachments[record.sku] });
    return { status: offer.status, price, imageCount };
  });

  const statuses = {};
  for (const result of results) statuses[result.status] = (statuses[result.status] ?? 0) + 1;
  return {
    statuses,
    totalPrice: results.reduce((sum, result) => sum + result.price, 0),
    imageCount: results.reduce((sum, result) => sum + result.imageCount, 0),
  };
}

async function mapLimit(values, concurrency, worker) {
  const results = new Array(values.length);
  let cursor = 0;
  async function run() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, run));
  return results;
}

async function retry(operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function saveJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function queueSave(path, value) {
  const snapshot = structuredClone(value);
  saveChain = saveChain.then(() => saveJson(path, snapshot));
  return saveChain;
}

function safeFilename(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}
