import { access, mkdir, readdir, stat } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const inventoryRoot = resolve(root, "inventory");
const publicRoot = resolve(root, "public");
const outputRoot = resolve(publicRoot, "inventory-previews");
const storagePath = resolve(inventoryRoot, "Storage Locations.json");
const attachmentsPath = resolve(root, "data/ebay/image-attachments.json");
const forceRefresh = process.env.INVENTORY_PREVIEWS_FORCE === "1";

try {
  await access(storagePath);
  await access(attachmentsPath);
} catch {
  console.log("Local scan sources are unavailable; preserving committed inventory previews.");
  process.exit(0);
}

const { readFile } = await import("node:fs/promises");
const storage = JSON.parse(await readFile(storagePath, "utf8"));
const attachments = JSON.parse(await readFile(attachmentsPath, "utf8"));
const needsPreview = storage.assignments.filter((record) => !attachments[record.sku]?.imageUrls?.[0]);

async function collectFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (path === outputRoot) continue;
    if (entry.isDirectory()) await collectFiles(path, output);
    else output.push(path);
  }
  return output;
}

const sourceFiles = [
  ...(await collectFiles(inventoryRoot)),
  ...(await collectFiles(resolve(publicRoot, "shop/inventory")).catch(() => [])),
];
const sourceByName = new Map(sourceFiles.map((path) => [basename(path).toLowerCase(), path]));

function findSource(sku, side) {
  const key = sku.toLowerCase();
  const candidates = [
    `${key}_${side}.jpg`, `${key}_${side}.jpeg`, `${key}_${side}.png`, `${key}_${side}.webp`,
    `${key}-${side}.jpg`, `${key}-${side}.jpeg`, `${key}-${side}.png`, `${key}-${side}.webp`,
  ];
  return candidates.map((name) => sourceByName.get(name)).find(Boolean) ?? null;
}

await mkdir(outputRoot, { recursive: true });
let generated = 0;
let preserved = 0;

for (const record of needsPreview) {
  for (const side of ["front", "back"]) {
    const source = findSource(record.sku, side);
    if (!source && side === "back" && /back scan pending/i.test(record.status ?? "")) {
      console.log(`Skipping intentionally pending back scan for ${record.sku}.`);
      continue;
    }
    if (!source) throw new Error(`Missing local ${side} scan for ${record.sku}`);
    const output = resolve(outputRoot, `${record.sku}_${side}.jpg`);
    const [sourceInfo, outputInfo] = await Promise.all([
      stat(source),
      stat(output).catch(() => null),
    ]);
    if (!forceRefresh && outputInfo && outputInfo.mtimeMs >= sourceInfo.mtimeMs) {
      preserved += 1;
      continue;
    }
    const rotation = /Batch (10|15)\b/.test(record.source) ? ["-r", "180"] : [];
    const result = spawnSync("sips", [
      ...rotation, "-Z", "1000", "-s", "format", "jpeg", "-s", "formatOptions", "55",
      source, "--out", output,
    ], { stdio: "ignore" });
    if (result.status !== 0) throw new Error(`Could not create web preview for ${record.sku} ${side}`);
    generated += 1;
  }
}

console.log(`Inventory previews ready: ${generated} generated, ${preserved} unchanged.`);
