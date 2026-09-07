import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { probeSource, sourceAdapters } from "./source-adapters.mjs";

const results = await Promise.all(Object.values(sourceAdapters).map((adapter) => probeSource(adapter)));
const snapshot = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  readOnly: true,
  sources: Object.fromEntries(results.map((result) => [result.sourceId, result])),
};

const target = resolve(process.cwd(), "data/market/source-probes.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`);

for (const result of results) {
  console.log(`${result.sourceId}: ${result.status}${result.error ? ` (${result.error})` : ""}`);
}

if (results.every((result) => result.status !== "connected")) process.exitCode = 1;
