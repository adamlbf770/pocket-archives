import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { ebayRequest, validAccessToken } from "./api.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const CACHE_PATH = join(ROOT, "data/ebay/image-uploads.json");
const ATTACHMENTS_PATH = join(ROOT, "data/ebay/image-attachments.json");
const DRAFTS_DIR = join(ROOT, "data/ebay/drafts");
const BATCHES = [
  {
    first: 53,
    last: 70,
    directory: join(ROOT, "inventory/Batch 07 - PA-0053-PA-0070/02 Listing Images"),
    namedFiles: true,
  },
  {
    first: 71,
    last: 188,
    directory: join(ROOT, "inventory/Batch 08 - PA-0071-PA-0188/02 Listing Images"),
  },
  {
    first: 189,
    last: 208,
    directory: join(ROOT, "inventory/Batch 09 - PA-0189-PA-0208/02 Listing Images"),
  },
  {
    first: 221,
    last: 441,
    directory: join(ROOT, "inventory/Batch 11 - PA-0221-PA-0441/02 Listing Images"),
  },
  {
    first: 442,
    last: 851,
    directory: join(ROOT, "inventory/Batch 12 - PA-0442-PA-0851/02 Listing Images"),
  },
  {
    first: 852,
    last: 914,
    directory: join(ROOT, "inventory/Batch 13 - Dragon Ball - PA-0852-PA-0914/02 Listing Images"),
  },
  {
    first: 915,
    last: 1353,
    directory: join(ROOT, "inventory/Batch 14 - Mixed - PA-0915-PA-1353/02 Listing Images"),
    gameSubdirectories: true,
  },
  {
    first: 1354,
    last: 1452,
    directory: join(ROOT, "inventory/Batch 15 - Magic - PA-1354-PA-1452/02 Listing Images"),
  },
  {
    first: 1453,
    last: 1454,
    directory: join(ROOT, "inventory/Batch 16 - Pokemon - PA-1453-PA-1454/02 Listing Images"),
  },
  {
    first: 1455,
    last: 1815,
    directory: join(ROOT, "inventory/Batch 17 - Pokemon Bulk - PA-1455-PA-1815/02 Listing Images"),
  },
  {
    first: 1816,
    last: 2590,
    directory: join(ROOT, "inventory/Batch 18 - Pokemon Box 5 - PA-1816-PA-2590/02 Listing Images"),
  },
];
const SORCERY_SKU = "PA-0209-0220-LOT";
const SORCERY_DIRECTORY = join(
  ROOT,
  "inventory/Batch 10 - Sorcery - PA-0209-PA-0220/02 Listing Images",
);
const UPLOAD_CONCURRENCY = 3;
const VERIFY_CONCURRENCY = 5;

const dryRun = process.argv.includes("--dry-run");
const verifyOnly = process.argv.includes("--verify-only");
const limitFlag = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitFlag ? Number(limitFlag.split("=")[1]) : Number.POSITIVE_INFINITY;
const fromFlag = process.argv.find((argument) => argument.startsWith("--from="));
const toFlag = process.argv.find((argument) => argument.startsWith("--to="));
const fromSku = fromFlag ? fromFlag.split("=")[1] : null;
const toSku = toFlag ? toFlag.split("=")[1] : null;
if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
  throw new Error("--limit must be a positive integer.");
}

const jobs = await discoverJobs();
const selectedJobs = jobs
  .filter((job) => !fromSku || job.sku.localeCompare(fromSku) >= 0)
  .filter((job) => !toSku || job.sku.localeCompare(toSku) <= 0)
  .slice(0, limit);
const expectedImages = selectedJobs.reduce((total, job) => total + job.images.length, 0);
console.log(
  `${dryRun ? "DRY RUN: " : ""}${selectedJobs.length} offers, ${expectedImages} images.`,
);

if (dryRun) {
  for (const job of selectedJobs) console.log(`${job.sku}: ${job.images.length} images`);
  process.exit(0);
}

if (verifyOnly) {
  await verifyAttachments(selectedJobs);
  process.exit(0);
}

const uploadCache = await readJson(CACHE_PATH, {});
const attachmentLog = await readJson(ATTACHMENTS_PATH, {});
let completed = 0;
let saveChain = Promise.resolve();

await mapLimit(selectedJobs, 3, async (job) => {
  const urls = await mapLimit(job.images, UPLOAD_CONCURRENCY, async (imagePath) => {
    const key = relativeKey(imagePath);
    if (uploadCache[key]?.url) return uploadCache[key].url;

    const url = await uploadPicture(imagePath, job.sku);
    uploadCache[key] = { url, uploadedAt: new Date().toISOString() };
    await queueSave(CACHE_PATH, uploadCache);
    return url;
  });

  await attachToInventoryItem(job.sku, urls);
  attachmentLog[job.sku] = {
    imageCount: urls.length,
    imageUrls: urls,
    attachedAt: new Date().toISOString(),
  };
  await queueSave(ATTACHMENTS_PATH, attachmentLog);
  completed += 1;
  console.log(`[${completed}/${selectedJobs.length}] Attached ${urls.length} images to ${job.sku}`);
});
await saveChain;

await verifyAttachments(selectedJobs);
console.log(`Complete: ${selectedJobs.length} unpublished offers verified with ${expectedImages} images.`);

async function discoverJobs() {
  const offerFiles = (await readdir(DRAFTS_DIR)).filter((name) => name.endsWith(".json"));
  const offerSkus = new Set();
  for (const file of offerFiles) {
    const record = await readJson(join(DRAFTS_DIR, file));
    if (!record?.sku) throw new Error(`Draft record ${file} has no SKU.`);
    offerSkus.add(record.sku);
  }

  if (offerSkus.has("PA-0198") || offerSkus.has("PA-0199")) {
    throw new Error("Safety stop: excluded Sliggoo or Zorua unexpectedly has an eBay offer.");
  }

  const jobs = [];
  for (const batch of BATCHES) {
    const names = batch.gameSubdirectories ? [] : await readdir(batch.directory);
    for (let number = batch.first; number <= batch.last; number += 1) {
      const sku = `PA-${String(number).padStart(4, "0")}`;
      if (!offerSkus.has(sku)) continue;
      const directory = batch.gameSubdirectories
        ? join(batch.directory, number <= 921 ? "Magic" : "Pokemon")
        : batch.directory;
      const directoryNames = batch.gameSubdirectories ? await readdir(directory) : names;
      const front = findImage(directoryNames, sku, "front", batch.namedFiles);
      const back = findImage(directoryNames, sku, "back", batch.namedFiles);
      jobs.push({ sku, images: [join(directory, front), join(directory, back)] });
    }
  }

  if (offerSkus.has(SORCERY_SKU)) {
    const names = await readdir(SORCERY_DIRECTORY);
    const images = [];
    for (let number = 209; number <= 220; number += 1) {
      const sku = `PA-${String(number).padStart(4, "0")}`;
      images.push(
        join(SORCERY_DIRECTORY, findImage(names, sku, "front")),
        join(SORCERY_DIRECTORY, findImage(names, sku, "back")),
      );
    }
    jobs.push({ sku: SORCERY_SKU, images });
  }

  const discovered = new Set(jobs.map((job) => job.sku));
  const missing = [...offerSkus].filter((sku) => !discovered.has(sku));
  if (missing.length) throw new Error(`No image mapping for offer SKU(s): ${missing.join(", ")}`);
  return jobs.sort((left, right) => left.sku.localeCompare(right.sku));
}

function findImage(names, sku, side, namedFiles = false) {
  const expected = namedFiles
    ? names.filter((name) => name.startsWith(`${sku}_`) && name.endsWith(`_${side}.jpg`))
    : names.filter((name) => name === `${sku}_${side}.jpg`);
  if (expected.length !== 1) {
    throw new Error(`Expected one ${side} image for ${sku}; found ${expected.length}.`);
  }
  return expected[0];
}

async function uploadPicture(imagePath, sku) {
  const token = await validAccessToken();
  const fileName = basename(imagePath);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials><eBayAuthToken>${escapeXml(token)}</eBayAuthToken></RequesterCredentials>
  <PictureName>${escapeXml(`${sku}-${fileName}`)}</PictureName>
  <PictureSet>Supersize</PictureSet>
</UploadSiteHostedPicturesRequest>`;

  return retry(async () => {
    const form = new FormData();
    form.append("XML Payload", xml);
    form.append("Binary Data", new Blob([await readFile(imagePath)], { type: "image/jpeg" }), fileName);

    const response = await fetch("https://api.ebay.com/ws/api.dll", {
      method: "POST",
      headers: {
        "X-EBAY-API-CALL-NAME": "UploadSiteHostedPictures",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1455",
        "X-EBAY-API-RESPONSE-ENCODING": "XML",
        "X-EBAY-API-SITEID": "0",
      },
      body: form,
    });
    const body = await response.text();
    const ack = xmlValue(body, "Ack");
    const url = xmlValue(body, "FullURL");
    if (!response.ok || !["Success", "Warning"].includes(ack) || !url) {
      const error = xmlValue(body, "LongMessage") || xmlValue(body, "ShortMessage") || body.slice(0, 500);
      throw new Error(`eBay picture upload failed for ${fileName}: ${error}`);
    }
    console.log(`Uploaded ${fileName}`);
    return decodeXml(url);
  });
}

async function attachToInventoryItem(sku, imageUrls) {
  if (imageUrls.length < 1 || imageUrls.length > 24) {
    throw new Error(`${sku} has ${imageUrls.length} images; eBay supports 1-24.`);
  }

  const current = await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
  const payload = structuredClone(current);
  delete payload.sku;
  delete payload.locale;
  delete payload.availability?.shipToLocationAvailability?.allocationByFormat;
  delete payload.packageWeightAndSize?.shippingIrregular;
  payload.product = { ...payload.product, imageUrls };

  await retry(() =>
    ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

async function verifyAttachments(jobsToVerify) {
  let verified = 0;
  await mapLimit(jobsToVerify, VERIFY_CONCURRENCY, async (job) => {
    const item = await retry(() =>
      ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(job.sku)}`),
    );
    const count = item?.product?.imageUrls?.length ?? 0;
    if (count !== job.images.length) {
      throw new Error(`Verification failed for ${job.sku}: expected ${job.images.length}, found ${count}.`);
    }
    verified += 1;
    if (verified % 25 === 0 || verified === jobsToVerify.length) {
      console.log(`Verified ${verified}/${jobsToVerify.length} offers`);
    }
  });
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

function xmlValue(xml, tagName) {
  return xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i"))?.[1]?.trim() ?? "";
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function relativeKey(path) {
  return path.startsWith(`${ROOT}/`) ? path.slice(ROOT.length + 1) : path;
}

function queueSave(path, value) {
  saveChain = saveChain.then(() => saveJson(path, value));
  return saveChain;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (arguments.length === 2 && error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function saveJson(path, value) {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
