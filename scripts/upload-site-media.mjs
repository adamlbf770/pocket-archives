import { createReadStream } from "node:fs";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const endpoint = (process.env.INVENTORY_MEDIA_UPLOAD_URL || "https://inventory.pocketarchives.com/api/media/upload").replace(/\/$/, "");
const token = process.env.INVENTORY_MEDIA_UPLOAD_TOKEN;
if (!token) throw new Error("INVENTORY_MEDIA_UPLOAD_TOKEN is required.");

const roots = [
  resolve(root, "public/art"),
  resolve(root, "public/shop"),
  resolve(root, "public/sprites"),
  resolve(root, "public/inventory-previews"),
];
const stateFile = resolve(root, ".site-media-upload-state.json");
const completed = new Set(JSON.parse(await readFile(stateFile, "utf8").catch(() => "[]")));
const files = [];
for (const folder of roots) await walk(folder, files);

let uploaded = 0;
let bytes = 0;
const queue = files.filter((file) => !completed.has(keyFor(file)));

async function worker() {
  while (queue.length) {
    const file = queue.shift();
    if (!file) return;
    const key = keyFor(file);
    const details = await stat(file);
    const url = `${endpoint}?key=${encodeURIComponent(key)}`;
    let response;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType(file),
          "Content-Length": String(details.size),
        },
        body: createReadStream(file),
        duplex: "half",
      });
      if (response.ok) break;
      if (attempt === 4) throw new Error(`Upload failed for ${key}: ${response.status} ${await response.text()}`);
      await new Promise((resolveWait) => setTimeout(resolveWait, attempt * 750));
    }
    completed.add(key);
    uploaded += 1;
    bytes += details.size;
    if (uploaded % 100 === 0) {
      await writeFile(stateFile, JSON.stringify([...completed]));
      console.log(`Uploaded ${uploaded}/${queue.length + uploaded} new files (${Math.round(bytes / 1024 / 1024)} MB).`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
await writeFile(stateFile, JSON.stringify([...completed]));
console.log(`Media upload complete: ${uploaded} uploaded, ${completed.size - uploaded} already completed.`);

async function walk(folder, output) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (/\.(?:jpe?g|png|webp|gif)$/i.test(entry.name)) output.push(path);
  }
}

function keyFor(file) {
  return relative(resolve(root, "public"), file).split(sep).join("/");
}

function contentType(file) {
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" })[extname(file).toLowerCase()] || "application/octet-stream";
}
