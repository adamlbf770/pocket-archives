import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Pocket Archives landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Pocket Archives/i);
  assert.match(html, /Pokémon design history, preserved/i);
  assert.match(html, /From first sketch/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("server-renders all batch 03 shop listings", async () => {
  const response = await render("/shop");
  assert.equal(response.status, 200);

  const html = await response.text();
  for (const title of ["Tyrogue", "Omanyte", "Treecko", "Poochyena"]) {
    assert.match(html, new RegExp(`>${title}<`, "i"));
  }
  for (const image of [
    "pa-0024-front.jpg",
    "pa-0025-front.jpg",
    "pa-0026-front.jpg",
    "pa-0027-front.jpg",
  ]) {
    assert.match(html, new RegExp(image, "i"));
  }
  assert.match(html, /The Town on No Map/i);
  assert.match(html, /EX Sandstorm/i);
  assert.match(html, /EX Ruby &amp; Sapphire/i);
});
