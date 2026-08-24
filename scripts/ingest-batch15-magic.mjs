#!/usr/bin/env node

import { mkdir, readdir, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const inbox = join(root, 'inventory/Scanner Inbox');
const batch = join(root, 'inventory/Batch 15 - Magic - PA-1354-PA-1452');
const rawDir = join(batch, '01 Raw Scanner Output');
const listingDir = join(batch, '02 Listing Images');

const scannerNames = (await readdir(inbox))
  .filter((name) => /^batch-14-card(?: \d+(?: \d+)?)?\.jpeg$/.test(name));
if (scannerNames.length !== 197) {
  throw new Error(`Safety stop: expected 197 scanner files; found ${scannerNames.length}.`);
}

const streams = [
  {
    name: 'Run 1',
    count: 134,
    rotation: 180,
    rawName(index) {
      return index === 0 ? 'batch-14-card.jpeg' : `batch-14-card ${index}.jpeg`;
    },
  },
  {
    name: 'Run 2',
    count: 64,
    rotation: 180,
    rawName(index) {
      return index === 0 ? 'batch-14-card 70.jpeg' : `batch-14-card 70 ${index}.jpeg`;
    },
  },
];

const expectedNames = streams.flatMap((stream) =>
  Array.from({ length: stream.count }, (_, index) => stream.rawName(index)),
);
const expectedSet = new Set(expectedNames);
const unexpected = scannerNames.filter((name) => !expectedSet.has(name));
const missing = expectedNames.filter((name) => !scannerNames.includes(name));
if (expectedSet.size !== 197 || unexpected.length || missing.length) {
  throw new Error(`Safety stop: scanner streams do not match. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
}

await mkdir(batch, { recursive: false });
await mkdir(rawDir, { recursive: false });
await mkdir(listingDir, { recursive: false });

const mapping = [];
let cardIndex = 0;
for (const stream of streams) {
  if (stream.count % 2 !== 0) throw new Error(`${stream.name} does not contain complete duplex pairs.`);
  for (let scanIndex = 0; scanIndex < stream.count; scanIndex += 2) {
    const sku = `PA-${String(1354 + cardIndex).padStart(4, '0')}`;
    const rawBack = stream.rawName(scanIndex);
    const rawFront = stream.rawName(scanIndex + 1);
    const frontImage = `${sku}_front.jpg`;
    const backImage = `${sku}_back.jpg`;
    const rotation = ['PA-1391', 'PA-1423'].includes(sku) ? 0 : stream.rotation;

    await Promise.all([
      prepare(join(inbox, rawFront), join(listingDir, frontImage), rotation),
      prepare(join(inbox, rawBack), join(listingDir, backImage), rotation),
    ]);
    mapping.push({
      sku,
      scannerRun: stream.name,
      scannerPair: scanIndex / 2 + 1,
      rotation,
      rawFront,
      rawBack,
      frontImage,
      backImage,
    });
    cardIndex += 1;
  }
}

if (mapping.length !== 99 || mapping.at(-1).sku !== 'PA-1452') {
  throw new Error(`Safety stop: expected 99 cards ending at PA-1452; prepared ${mapping.length}.`);
}

const listingNames = (await readdir(listingDir)).filter((name) => name.endsWith('.jpg'));
if (listingNames.length !== 198) {
  throw new Error(`Safety stop: expected 198 listing images; found ${listingNames.length}.`);
}

const headers = ['SKU', 'Scanner Run', 'Scanner Pair', 'Rotation Applied', 'Raw Front', 'Raw Back', 'Front Image', 'Back Image'];
const csv = [
  headers,
  ...mapping.map((row) => [
    row.sku,
    row.scannerRun,
    row.scannerPair,
    row.rotation,
    row.rawFront,
    row.rawBack,
    row.frontImage,
    row.backImage,
  ]),
].map((row) => row.map(csvCell).join(',')).join('\n');
await writeFile(join(batch, 'Batch 15 Scan Mapping.csv'), `${csv}\n`);
await writeFile(join(batch, 'README.md'), [
  '# Batch 15 — Magic: The Gathering — PA-1354 through PA-1452',
  '',
  '- 99 physical Magic: The Gathering cards.',
  '- 198 exact listing images: one front and one back per SKU.',
  '- 197 untouched scanner files preserved across two duplex runs.',
  '- Both scanner runs were uniformly rotated 180 degrees and normalized in the listing-image copies only.',
  '- PA-1391 and PA-1423 were the two orientation exceptions and required no rotation.',
  '- This batch is local only. No eBay drafts, offers, or listings were created or changed.',
  '',
].join('\n'));

for (const name of scannerNames) await rename(join(inbox, name), join(rawDir, name));
console.log(`Organized ${mapping.length} Magic cards with ${listingNames.length} listing images in ${batch}`);

async function prepare(source, destination, rotation) {
  let pipeline = sharp(source);
  if (rotation) pipeline = pipeline.rotate(rotation);
  await pipeline
    .trim({ threshold: 18 })
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
    .toFile(destination);
}

function csvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
