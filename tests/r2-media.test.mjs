import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${label}`);
  return (await import(workerUrl.href)).default;
}

function context() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("R2-backed media falls through after a missing bundled asset", async () => {
  const worker = await loadWorker("r2-fallback");
  const key = "inventory-previews/PA-0001_front.jpg";
  const body = new TextEncoder().encode("stored-in-r2");
  const response = await worker.fetch(
    new Request(`https://inventory.pocketarchives.com/${key}`),
    {
      ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
      INVENTORY_MEDIA: {
        get: async (requestedKey) => requestedKey === key
          ? { body: new Blob([body]).stream(), httpEtag: '"test-etag"', httpMetadata: { contentType: "image/jpeg" } }
          : null,
      },
    },
    context(),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("etag"), '"test-etag"');
  assert.equal(await response.text(), "stored-in-r2");
});

test("bundled assets take precedence and unknown R2 media returns 404", async () => {
  const worker = await loadWorker("asset-priority");
  const assetResponse = await worker.fetch(
    new Request("https://inventory.pocketarchives.com/art/0001.webp"),
    {
      ASSETS: { fetch: async () => new Response("bundled", { status: 200 }) },
      INVENTORY_MEDIA: { get: async () => { throw new Error("R2 should not be queried"); } },
    },
    context(),
  );
  assert.equal(await assetResponse.text(), "bundled");

  const missingResponse = await worker.fetch(
    new Request("https://inventory.pocketarchives.com/shop/not-present.jpg"),
    {
      ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
      INVENTORY_MEDIA: { get: async () => null },
    },
    context(),
  );
  assert.equal(missingResponse.status, 404);
});

test("media uploads require the configured bearer token", async () => {
  const worker = await loadWorker("upload-auth");
  const response = await worker.fetch(
    new Request("https://inventory.pocketarchives.com/api/media/upload?key=art/test.webp", {
      method: "PUT",
      body: "no token",
    }),
    {
      ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
      INVENTORY_MEDIA_UPLOAD_TOKEN: "expected-token",
      INVENTORY_MEDIA: {},
    },
    context(),
  );
  assert.equal(response.status, 401);
});
