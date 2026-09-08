#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { inspectPair } from "./quality.mjs";
import { analyzeOrientation } from "./orientation.mjs";
import { normalizeIdentity, duplicateKey } from "./identity.mjs";
import { scoreCandidate } from "./confidence.mjs";
import { verifyIdentity } from "./sources.mjs";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node scripts/ingestion/run-batch.mjs PATH_TO_BATCH_INPUT.json");
const input = JSON.parse(await readFile(resolve(inputPath), "utf8"));
if (!input.batchId || !Array.isArray(input.cards)) throw new Error("Input requires batchId and cards[].");
const seen = new Map();
const cards = [];

for (const item of input.cards) {
  const guess = normalizeIdentity(item.guess);
  const [quality, orientation, externalMatch] = await Promise.all([
    inspectPair(resolve(item.front), resolve(item.back)),
    analyzeOrientation(resolve(item.front)),
    verifyIdentity(guess),
  ]);
  const key = duplicateKey(guess);
  const duplicateOf = seen.get(key) ?? null;
  const duplicate = Boolean(duplicateOf);
  seen.set(key, item.sku);
  const confidence = scoreCandidate({ candidate: guess, externalMatch, orientation, quality, duplicate });
  cards.push({ sku: item.sku, front: { path: resolve(item.front), orientation }, back: { path: resolve(item.back) }, guess, externalMatch, quality, duplicateOf, confidence });
}

const summary = Object.fromEntries(["AUTO_DRAFT", "REVIEW", "RESCAN", "CONFLICT"].map((state) => [state, cards.filter((card) => card.confidence.state === state).length]));
const output = { schemaVersion: 1, batchId: input.batchId, createdAt: new Date().toISOString(), publishMode: "DRAFT_ONLY", summary, cards };
const target = resolve("outputs/ingestion", `${input.batchId}.json`);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(resolve("outputs/ingestion/latest.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ target, summary }, null, 2));
