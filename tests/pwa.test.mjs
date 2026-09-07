import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("PWA manifest launches the inventory app in standalone mode", async () => {
  const manifest = JSON.parse(await readFile(new URL("public/manifest.webmanifest", root), "utf8"));
  assert.equal(manifest.start_url, "/inventory");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("service worker does not persist owner-only page documents", async () => {
  const worker = await readFile(new URL("public/sw.js", root), "utf8");
  const appShell = worker.match(/const APP_SHELL = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /fetch\(request\)\.catch/);
  assert.doesNotMatch(appShell, /"\/inventory"/);
  assert.doesNotMatch(appShell, /"\/market"/);
});
