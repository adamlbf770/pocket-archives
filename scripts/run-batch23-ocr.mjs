#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const batch = join(root, "inventory/Batch 23 - Pokemon Box 1 - PA-3649-PA-3996");
const listing = join(batch, "02 Listing Images");
const review = join(batch, "03 Identification Review");
const output = join(review, "Batch 23 OCR.jsonl");
await mkdir(review, { recursive: true });

const fronts = (await readdir(listing))
  .filter((name) => name.endsWith("_front.jpg"))
  .sort()
  .map((name) => join(listing, name));
if (fronts.length !== 348) throw new Error(`Safety stop: expected 348 Batch 23 fronts, found ${fronts.length}.`);

const child = spawn("swift", [join(root, "scripts/ocr-card-fronts.swift"), ...fronts], {
  stdio: ["ignore", "pipe", "inherit"],
});
const destination = createWriteStream(output, { encoding: "utf8" });
child.stdout.pipe(destination);
const exitCode = await new Promise((resolveCode, reject) => {
  child.once("error", reject);
  child.once("close", resolveCode);
});
if (exitCode !== 0) throw new Error(`Batch 23 OCR failed with exit code ${exitCode}.`);
console.log(`Wrote OCR for ${fronts.length} Batch 23 fronts to ${output}.`);
