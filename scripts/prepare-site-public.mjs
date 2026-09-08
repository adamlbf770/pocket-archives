import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "public");
const target = resolve(root, ".site-public");
const remoteFolders = new Set(["inventory-previews", "art", "shop", "sprites"]);

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const entry of await readdir(source, { withFileTypes: true })) {
  if (remoteFolders.has(entry.name)) continue;
  await cp(resolve(source, entry.name), resolve(target, entry.name), {
    recursive: true,
    preserveTimestamps: true,
  });
}

console.log("Prepared hosted public assets; large media folders will be served from R2.");
