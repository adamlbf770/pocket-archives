#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { inspectPair } from "./quality.mjs";
import { analyzeOrientation, normalizeOrientation } from "./orientation.mjs";
import { normalizeIdentity, duplicateKey } from "./identity.mjs";
import { scoreCandidate } from "./confidence.mjs";
import { verifyIdentity } from "./sources.mjs";
import { createExternalVerificationCertificate } from "./ebay-gate.mjs";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node scripts/ingestion/run-batch.mjs PATH_TO_BATCH_INPUT.json");
const input = JSON.parse(await readFile(resolve(inputPath), "utf8"));
if (!input.batchId || !Array.isArray(input.cards)) throw new Error("Input requires batchId and cards[].");
const seen = new Map();
const cards = [];
const safeBatchId = String(input.batchId).replace(/[^a-z0-9._-]+/gi, "-");
const normalizedRoot = resolve("outputs/ingestion", safeBatchId, "normalized");

for (const item of input.cards) {
  const guess = normalizeIdentity(item.guess);
  const [frontAnalysis, backAnalysis] = await Promise.all([
    analyzeOrientation(resolve(item.front)),
    analyzeOrientation(resolve(item.back)),
  ]);
  const orientation = combineOrientation(frontAnalysis, backAnalysis);
  let front = { path: resolve(item.front), orientation: frontAnalysis };
  let back = { path: resolve(item.back), orientation: backAnalysis };
  if (orientation.confidence === "high") {
    const frontExt = extname(item.front) || ".jpg";
    const backExt = extname(item.back) || ".jpg";
    front = {
      path: resolve(normalizedRoot, `${item.sku}-front${frontExt.toLowerCase()}`),
      orientation: await normalizeOrientation(item.front, frontAnalysis, resolve(normalizedRoot, `${item.sku}-front${frontExt.toLowerCase()}`)),
    };
    back = {
      path: resolve(normalizedRoot, `${item.sku}-back${backExt.toLowerCase()}`),
      orientation: await normalizeOrientation(item.back, backAnalysis, resolve(normalizedRoot, `${item.sku}-back${backExt.toLowerCase()}`)),
    };
  }
  const [quality, externalMatch] = await Promise.all([
    inspectPair(front.path, back.path),
    verifyIdentity(guess),
  ]);
  const key = duplicateKey(guess);
  const duplicateOf = seen.get(key) ?? null;
  const duplicate = Boolean(duplicateOf);
  seen.set(key, item.sku);
  const confidence = scoreCandidate({ candidate: guess, externalMatch, orientation, quality, duplicate });
  const card = { sku: item.sku, condition: item.condition ?? item.guess?.condition ?? "", front, back, guess, externalMatch, quality, duplicateOf, confidence };
  if (confidence.state === "AUTO_DRAFT") {
    try {
      card.listingVerification = createExternalVerificationCertificate(card);
    } catch (error) {
      card.confidence = { ...confidence, state: "REVIEW", grade: "MEDIUM", reasons: [...confidence.reasons, error.message] };
    }
  }
  cards.push(card);
}

const summary = Object.fromEntries(["AUTO_DRAFT", "REVIEW", "RESCAN", "CONFLICT"].map((state) => [state, cards.filter((card) => card.confidence.state === state).length]));
const output = { schemaVersion: 1, batchId: input.batchId, createdAt: new Date().toISOString(), publishMode: "DRAFT_ONLY", summary, cards };
const target = resolve("outputs/ingestion", `${input.batchId}.json`);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(resolve("outputs/ingestion/latest.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ target, summary }, null, 2));

function combineOrientation(front, back) {
  const levels = { low: 0, medium: 1, high: 2 };
  const confidence = levels[front.confidence] <= levels[back.confidence] ? front.confidence : back.confidence;
  return { confidence, front, back };
}
