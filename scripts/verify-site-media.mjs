import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicRoot = resolve(root, "public");
const mediaRoots = ["art", "shop", "sprites", "inventory-previews"];
const stateFile = resolve(root, ".site-media-upload-state.json");
const baseUrl = (process.env.INVENTORY_MEDIA_PUBLIC_URL || "https://inventory.pocketarchives.com").replace(/\/$/, "");
const remote = process.argv.includes("--remote");
const requestedSamples = Number(process.env.INVENTORY_MEDIA_VERIFY_SAMPLES || 32);

const files = [];
for (const directory of mediaRoots) await walk(resolve(publicRoot, directory), files);
const localKeys = files.map(keyFor).sort();
const completed = new Set(JSON.parse(await readFile(stateFile, "utf8")));
const missingFromCheckpoint = localKeys.filter((key) => !completed.has(key));

if (missingFromCheckpoint.length) {
  throw new Error(`${missingFromCheckpoint.length} local media files are absent from the upload checkpoint. First: ${missingFromCheckpoint[0]}`);
}

console.log(`Checkpoint covers all ${localKeys.length.toLocaleString()} local media files.`);

if (remote) {
  const samples = evenlySpaced(localKeys, requestedSamples);
  const failures = [];
  for (const key of samples) {
    const url = `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(url, { headers: { accept: "image/*" } });
    if (!response.ok) {
      failures.push(`${key}: HTTP ${response.status}`);
      continue;
    }
    const [local, hosted] = await Promise.all([
      readFile(resolve(publicRoot, key)),
      response.arrayBuffer().then((value) => Buffer.from(value)),
    ]);
    if (sha256(local) !== sha256(hosted)) failures.push(`${key}: checksum mismatch`);
  }
  if (failures.length) throw new Error(`Remote media verification failed:\n${failures.join("\n")}`);
  console.log(`Verified ${samples.length} evenly spaced hosted objects byte-for-byte.`);
}

async function walk(directory, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (/\.(?:jpe?g|png|webp|gif)$/i.test(entry.name)) output.push(path);
  }
}

function keyFor(file) {
  return relative(publicRoot, file).split(sep).join("/");
}

function evenlySpaced(values, count) {
  if (!values.length || count <= 0) return [];
  const size = Math.min(values.length, Math.floor(count));
  if (size === 1) return [values[0]];
  return Array.from({ length: size }, (_, index) => values[Math.round(index * (values.length - 1) / (size - 1))]);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
