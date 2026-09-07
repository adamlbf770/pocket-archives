import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { ebayRequest, validAccessToken } from "./api.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const CACHE_PATH = join(ROOT, "data/ebay/image-uploads.json");
const ATTACHMENTS_PATH = join(ROOT, "data/ebay/image-attachments.json");
const DRAFTS_DIR = join(ROOT, "data/ebay/drafts");
const BATCHES = [
  {
    first: 13,
    last: 15,
    directory: join(ROOT, "public/shop/inventory/batch-01"),
    legacyFiles: true,
  },
  {
    first: 20,
    last: 23,
    directory: join(ROOT, "public/shop/inventory/batch-02"),
    legacyFiles: true,
  },
  {
    first: 24,
    last: 27,
    directory: join(ROOT, "public/shop/inventory/batch-03"),
    legacyFiles: true,
  },
  {
    first: 28,
    last: 36,
    directory: join(ROOT, "public/shop/inventory/batch-04"),
    legacyFiles: true,
  },
  {
    first: 37,
    last: 40,
    directory: join(ROOT, "public/shop/inventory/batch-05"),
    legacyFiles: true,
  },
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
  {
    first: 2591,
    last: 3408,
    directory: join(ROOT, "inventory/Batch 19 - Pokemon Box 6 - PA-2591-PA-3408/02 Listing Images"),
  },
  {
    first: 3409,
    last: 3639,
    directory: join(ROOT, "inventory/Batch 20 - Pokemon Box 7 - PA-3409-PA-3639/02 Listing Images"),
  },
  {
    first: 3640,
    last: 3645,
    directory: join(ROOT, "inventory/Batch 21 - Pokemon Ultrarare Box 1 - PA-3640-PA-3645/02 Listing Images"),
  },
  {
    first: 3646,
    last: 3648,
    directory: join(ROOT, "inventory/Batch 22 - Pokemon Box 3 Reverse Holo - PA-3646-PA-3648/02 Listing Images"),
  },
  {
    first: 3649,
    last: 3996,
    directory: join(ROOT, "inventory/Batch 23 - Pokemon Box 1 - PA-3649-PA-3996/02 Listing Images"),
  },
  {
    first: 3997,
    last: 4094,
    directory: join(ROOT, "inventory/Batch 24 - Pokemon Ultrarare Box 1 - PA-3997-PA-4094/02 Listing Images"),
  },
  {
    first: 4095,
    last: 4096,
    directory: join(ROOT, "inventory/Batch 25 - Pokemon Ultrarare Box 1 - PA-4095-PA-4096/02 Listing Images"),
  },
  {
    first: 4097,
    last: 4097,
    directory: join(ROOT, "inventory/Batch 26 - Pokemon Ultrarare Box 1 - PA-4097/02 Listing Images"),
  },
  {
    first: 4098,
    last: 4146,
    directory: join(ROOT, "inventory/Batch 27 - Pokemon Box 3 and Box 1 - PA-4098-PA-4146/02 Listing Images"),
  },
  {
    first: 4147,
    last: 4233,
    directory: join(ROOT, "inventory/Batch 28 - Yu-Gi-Oh Box 2 - PA-4147-PA-4233/02 Listing Images"),
  },
  {
    first: 4234,
    last: 4385,
    directory: join(ROOT, "inventory/Batch 29 - Pokemon Type Sort - PA-4234-PA-4385/02 Listing Images"),
  },
  {
    first: 4386,
    last: 4404,
    directory: join(ROOT, "inventory/Batch 30 - Pokemon Ultrarare Box 1 - PA-4386-PA-4404/02 Listing Images"),
  },
  {
    first: 4405,
    last: 4419,
    directory: join(ROOT, "inventory/Batch 31 - Pokemon Ultrarare Box 1 - PA-4405-PA-4419/02 Listing Images"),
  },
  {
    first: 4420,
    last: 4452,
    directory: join(ROOT, "inventory/Batch 32 - Pokemon Cool Art Box - PA-4420-PA-4452/02 Listing Images"),
  },
  {
    first: 4453,
    last: 4552,
    directory: join(ROOT, "inventory/Batch 33 - Pokemon Cool Art Box Legacy Intake - PA-4453-PA-4552/02 Listing Images"),
  },
  {
    first: 4615,
    last: 5475,
    directory: join(ROOT, "inventory/Batch 35 - Pokemon Box 8 - PA-4615-PA-5475/02 Listing Images"),
  },
  {
    first: 5476,
    last: 5948,
    directory: join(ROOT, "inventory/Batch 36 - Pokemon Box 9 - PA-5476-PA-5948/02 Listing Images"),
  },
  {
    first: 5949,
    last: 6005,
    directory: join(ROOT, "inventory/Batch 37 - Pokemon Ultrarare Box 1 - PA-5949-PA-6005/02 Listing Images"),
  },
  {
    first: 6006,
    last: 6254,
    directory: join(ROOT, "inventory/Batch 38 - Pokemon Box 3 - PA-6006-PA-6254/02 Listing Images"),
  },
  {
    first: 6255,
    last: 6401,
    directory: join(ROOT, "inventory/Batch 39 - DBZ Box - PA-6255-PA-6401/02 Listing Images"),
  },
  {
    first: 6402,
    last: 6418,
    directory: join(ROOT, "inventory/Batch 40 - Pokemon Ultrarare Box 1 - PA-6402-PA-6418/02 Listing Images"),
  },
  {
    first: 6419,
    last: 6421,
    directory: join(ROOT, "inventory/Batch 41 - Box 2 - PA-6419-PA-6421/02 Listing Images"),
  },
  {
    first: 6422,
    last: 6433,
    directory: join(ROOT, "inventory/Batch 42 - Pokemon Box 1 - PA-6422-PA-6433/02 Listing Images"),
  },
  {
    first: 6434,
    last: 6462,
    directory: join(ROOT, "inventory/Batch 43 - Pokemon Box 3 - PA-6434-PA-6462/02 Listing Images"),
  },
  {
    first: 6463,
    last: 6516,
    directory: join(ROOT, "inventory/Batch 44 - Pokemon Box 10 - PA-6463-PA-6516/02 Listing Images"),
  },
  {
    first: 6517,
    last: 6622,
    directory: join(ROOT, "inventory/Batch 45 - Pokemon Aaron Box - PA-6517-PA-6622/02 Listing Images"),
  },
  {
    first: 6856,
    last: 7104,
    directory: join(ROOT, "inventory/Batch 53 - Pokemon PK0001A - PA-6856-PA-7104/02 Listing Images"),
  },
  {
    first: 7105,
    last: 7338,
    directory: join(ROOT, "inventory/Batch 54 - Pokemon PK0002A - PA-7105-PA-7338/02 Listing Images"),
  },
  {
    first: 7339,
    last: 7528,
    directory: join(ROOT, "inventory/Batch 55 - Pokemon PK0003A - PA-7339-PA-7528/02 Listing Images"),
  },
  {
    first: 7529,
    last: 7761,
    directory: join(ROOT, "inventory/Batch 56 - Pokemon PK0004A - PA-7529-PA-7761/02 Listing Images"),
  },
  {
    first: 8745,
    last: 8756,
    directory: join(ROOT, "inventory/Batch 63 - Pokemon Box 3 BOX3-20260902 - PA-8745-PA-8756/02 Listing Images"),
  },
  {
    first: 8757,
    last: 8832,
    directory: join(ROOT, "inventory/Batch 64 - Magic MTG0001B - PA-8757-PA-8832/02 Listing Images"),
  },
  {
    first: 8833,
    last: 8949,
    directory: join(ROOT, "inventory/Batch 65 - Magic MTG0002B - PA-8833-PA-8949/02 Listing Images"),
  },
  {
    first: 8950,
    last: 9045,
    directory: join(ROOT, "inventory/Batch 66 - Magic MTG0003B - PA-8950-PA-9045/02 Listing Images"),
  },
  {
    first: 9046,
    last: 9136,
    directory: join(ROOT, "inventory/Batch 67 - Magic MTG0004B - PA-9046-PA-9136/02 Listing Images"),
  },
  {
    first: 9137,
    last: 9260,
    directory: join(ROOT, "inventory/Batch 68 - Magic MTG0005B - PA-9137-PA-9260/02 Listing Images"),
  },
  {
    first: 9261,
    last: 9405,
    directory: join(ROOT, "inventory/Batch 69 - Magic MTG0006B - PA-9261-PA-9405/02 Listing Images"),
  },
  {
    first: 9406,
    last: 9510,
    directory: join(ROOT, "inventory/Batch 70 - Magic MTG0007B - PA-9406-PA-9510/02 Listing Images"),
  },
  {
    first: 9511,
    last: 9580,
    directory: join(ROOT, "inventory/Batch 71 - Magic MTG0008B - PA-9511-PA-9580/02 Listing Images"),
  },
  {
    first: 9581,
    last: 9592,
    directory: join(ROOT, "inventory/Batch 72 - Pokemon Box 3 Mixed Holos - PA-9581-PA-9592/02 Listing Images"),
  },
  {
    first: 9594,
    last: 9603,
    directory: join(ROOT, "inventory/Batch 73 - Pokemon Cardass Box New - PA-9593-PA-9603/02 Listing Images"),
  },
  {
    first: 9604,
    last: 9617,
    directory: join(ROOT, "inventory/Batch 74 - Yu-Gi-Oh Box 2 - PA-9604-PA-9617/02 Listing Images"),
  },
  {
    first: 9618,
    last: 9621,
    directory: join(ROOT, "inventory/Batch 75 - Pokemon Vintage Hits - PA-9618-PA-9621/02 Listing Images"),
  },
  {
    first: 9804,
    last: 9808,
    directory: join(ROOT, "inventory/Batch 78 - Yu-Gi-Oh Box 2 - PA-9804-PA-9808/02 Listing Images"),
  },
  {
    first: 9809,
    last: 9813,
    directory: join(ROOT, "inventory/Batch 79 - Pokemon Ultrarare Box 1 - PA-9809-PA-9813/02 Listing Images"),
  },
  {
    first: 9814,
    last: 9823,
    directory: join(ROOT, "inventory/Batch 80 - Pokemon Aaron Box - PA-9814-PA-9823/02 Listing Images"),
  },
  {
    first: 9824,
    last: 9887,
    directory: join(ROOT, "inventory/Batch 81 - Riftbound Box 2 - PA-9824-PA-9887/02 Listing Images"),
  },
  {
    first: 9888,
    last: 9889,
    directory: join(ROOT, "inventory/Batch 82 - Pokemon Slab Case - PA-9888-PA-9889/02 Listing Images"),
  },
  {
    first: 9992,
    last: 10185,
    directory: join(ROOT, "inventory/Batch 96 - One Piece OP0001A - PA-9992-PA-10185/02 Listing Images"),
  },
  {
    first: 10186,
    last: 10298,
    directory: join(ROOT, "inventory/Batch 97 - One Piece OP0003A - PA-10186-PA-10298/02 Listing Images"),
  },
  {
    first: 10299,
    last: 10494,
    directory: join(ROOT, "inventory/Batch 98 - One Piece OP0004A - PA-10299-PA-10494/02 Listing Images"),
  },
  {
    first: 10495,
    last: 10502,
    directory: join(ROOT, "inventory/Batch 99 - Pokemon Slab Case - PA-10495-PA-10502/02 Listing Images"),
  },
  {
    first: 10503,
    last: 10506,
    directory: join(ROOT, "inventory/Batch 100 - Pokemon Ultrarare Box 1 - PA-10503-PA-10506/02 Listing Images"),
  },
  {
    first: 10507,
    last: 10513,
    directory: join(ROOT, "inventory/Batch 101 - Pokemon Cardass Topps Box - PA-10507-PA-10513/02 Listing Images"),
  },
  {
    first: 10514,
    last: 10516,
    directory: join(ROOT, "inventory/Batch 102 - Pokemon Chinese Ultrarare Box 1 - PA-10514-PA-10516/02 Listing Images"),
  },
  {
    first: 10517,
    last: 10657,
    directory: join(ROOT, "inventory/Batch 103 - Pokemon Chinese Box 3 Gem Pack - PA-10517-PA-10657/02 Listing Images"),
  },
  {
    first: 10658,
    last: 10677,
    directory: join(ROOT, "inventory/Batch 104 - Pokemon English Box 3 - PA-10658-PA-10677/02 Listing Images"),
  },
  {
    first: 10678,
    last: 10742,
    directory: join(ROOT, "inventory/Batch 105 - Magic MTG0012B Nonfoil - PA-10678-PA-10742/02 Listing Images"),
  },
  {
    first: 10743,
    last: 10815,
    directory: join(ROOT, "inventory/Batch 106 - Magic MTG0013B Nonfoil - PA-10743-PA-10815/02 Listing Images"),
  },
  {
    first: 10816,
    last: 10957,
    directory: join(ROOT, "inventory/Batch 107 - Magic MTG0001B Nonfoil - PA-10816-PA-10957/02 Listing Images"),
  },
  {
    first: 10958,
    last: 11023,
    directory: join(ROOT, "inventory/Batch 108 - Magic MTG0003B Nonfoil - PA-10958-PA-11023/02 Listing Images"),
  },
  {
    first: 11024,
    last: 11086,
    directory: join(ROOT, "inventory/Batch 109 - Magic MTG0004B Nonfoil - PA-11024-PA-11086/02 Listing Images"),
  },
  {
    first: 11087,
    last: 11159,
    directory: join(ROOT, "inventory/Batch 110 - Magic MTG0005B Nonfoil - PA-11087-PA-11159/02 Listing Images"),
  },
  {
    first: 11160,
    last: 11234,
    directory: join(ROOT, "inventory/Batch 111 - Magic MTG0006B Nonfoil - PA-11160-PA-11234/02 Listing Images"),
  },
  {
    first: 11235,
    last: 11313,
    directory: join(ROOT, "inventory/Batch 112 - Magic MTG0007B Nonfoil - PA-11235-PA-11313/02 Listing Images"),
  },
  {
    first: 11314,
    last: 11381,
    directory: join(ROOT, "inventory/Batch 113 - Magic MTG0008B Nonfoil - PA-11314-PA-11381/02 Listing Images"),
  },
  {
    first: 11382,
    last: 11443,
    directory: join(ROOT, "inventory/Batch 114 - Magic MTG0009B Nonfoil - PA-11382-PA-11443/02 Listing Images"),
  },
  {
    first: 11444,
    last: 11514,
    directory: join(ROOT, "inventory/Batch 115 - Magic MTG0010B Nonfoil - PA-11444-PA-11514/02 Listing Images"),
  },
  {
    first: 11515,
    last: 11595,
    directory: join(ROOT, "inventory/Batch 116 - Magic MTG0011B Nonfoil - PA-11515-PA-11595/02 Listing Images"),
  },
  {
    first: 11596,
    last: 11623,
    directory: join(ROOT, "inventory/Batch 117 - Pokemon Ultrarare Binder - PA-11596-PA-11623/02 Listing Images"),
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
const skuFileFlag = process.argv.find((argument) => argument.startsWith("--sku-file="));
const requestedSkus = skuFileFlag
  ? new Set((await readFile(resolve(skuFileFlag.slice("--sku-file=".length)), "utf8")).split(/\r?\n/).map((value) => value.trim()).filter(Boolean))
  : null;
const forceReupload = process.argv.includes("--force-reupload");
if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
  throw new Error("--limit must be a positive integer.");
}

const jobs = await discoverJobs();
const selectedJobs = jobs
  .filter((job) => !requestedSkus || requestedSkus.has(job.sku))
  .filter((job) => !fromSku || skuNumber(job.sku) >= skuNumber(fromSku))
  .filter((job) => !toSku || skuNumber(job.sku) <= skuNumber(toSku))
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
    if (!forceReupload && uploadCache[key]?.url) return uploadCache[key].url;

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
      const front = findImage(directoryNames, sku, "front", batch.namedFiles, batch.legacyFiles);
      const back = findImage(directoryNames, sku, "back", batch.namedFiles, batch.legacyFiles);
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
  return jobs.sort((left, right) => skuNumber(left.sku) - skuNumber(right.sku));
}

function skuNumber(sku) {
  const match = String(sku).match(/^PA-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function findImage(names, sku, side, namedFiles = false, legacyFiles = false) {
  const expected = legacyFiles
    ? names.filter((name) => name === `${sku.toLowerCase()}-${side}.jpg`)
    : namedFiles
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

  const current = await retry(() =>
    ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`),
  );
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
