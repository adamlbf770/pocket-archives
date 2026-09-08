import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
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
  assert.match(html, /A curated archive of trading cards/i);
  assert.match(html, /Search the archive/i);
  assert.match(html, /Front \+ back/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("the public shop links lead to the temporary eBay storefront", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.match(html, /https:\/\/www\.ebay\.com\/str\/pocketarchives/i);
  assert.doesNotMatch(html, /href="https:\/\/shop\.pocketarchives\.com\/shop"/i);
});

test("early archive records expose audited provenance without invented plate numbers", async () => {
  const source = await readFile(
    new URL("../app/archive/canonical-data.generated.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /Prototype artwork plate/);
  assert.doesNotMatch(source, /Carddass action archive sheet/);
  assert.doesNotMatch(source, /Beta sprite specimen/);
  assert.match(source, /c\. 1993/);
  assert.match(source, /"provenance":/i);
  assert.match(source, /individual page authorship not independently verified/i);
  assert.match(source, /not itself a 1990 artifact/i);
  assert.match(source, /Artist attribution and unique-use claims need original Bandai credits/i);
});

test("canonical research registers stay connected to the archive build", async () => {
  const source = await readFile(
    new URL("../app/archive/canonical-data.generated.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /PA-CM-021/);
  assert.match(source, /PA-A100/);
  assert.match(source, /1401044258-021/);
  assert.match(source, /Copyrighted; commercial reuse not cleared/i);
});

test("the Capsule Monsters proposal is introduced in plain museum language", async () => {
  const archiveSource = await readFile(
    new URL("../app/archive/canonical-data.generated.ts", import.meta.url),
    "utf8",
  );
  assert.match(archiveSource, /The Proposal That Became Pokémon/i);
  assert.match(archiveSource, /At the time the project was called Capsule Monsters/i);
  assert.doesNotMatch(archiveSource, /Working title; named project role; explicit 1990 object date/i);
});

test("internal research planners are not exposed in production", async () => {
  for (const pathname of ["/internal", "/internal/acquisitions", "/internal/cgc", "/internal/slab-deals"]) {
    const response = await render(pathname);
    assert.equal(response.status, 404);
  }
});

test("the sprite exhibit contains all 151 across the six Game Boy releases", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/data/sprite-evolution.json", import.meta.url),
      "utf8",
    ),
  );
  const expectedEras = [
    "red-green-jp",
    "red-blue-gameboy",
    "yellow-gameboy",
    "gold-gameboy",
    "silver-gameboy",
    "crystal-gameboy",
  ];

  assert.deepEqual(
    manifest.eras.map((era) => era.key),
    expectedEras,
  );
  for (const era of expectedEras) {
    const spriteDirectory = new URL(`../public/sprites/${era}/`, import.meta.url);
    const sprites = (await readdir(spriteDirectory))
      .filter((filename) => /^\d{4}\.png$/.test(filename))
      .sort();

    assert.equal(sprites.length, 151, `${era} is missing sprites`);
    for (const filename of sprites) {
      const png = await readFile(new URL(filename, spriteDirectory));
      assert.equal(png.toString("ascii", 1, 4), "PNG");
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      assert.ok(width <= 56 && height <= 56, `${era}/${filename} is not an original-size sprite`);
    }
  }
});

test("server-renders the current searchable eBay catalog", async () => {
  const response = await render("/shop");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Find something good/i);
  assert.match(html, /Card, set, artist, or number/i);
  assert.match(html, /Every card uses its actual photos/i);
  assert.match(html, /https:\/\/www\.ebay\.com\/str\/pocketarchives/i);
  assert.match(html, /\/inventory-previews\//i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("slim production output excludes R2-backed media while retaining app assets", async () => {
  await access(new URL("../dist/client/manifest.webmanifest", import.meta.url));
  await access(new URL("../dist/client/og-shop.png", import.meta.url));
  for (const directory of ["inventory-previews", "art", "shop", "sprites"]) {
    await assert.rejects(access(new URL(`../dist/client/${directory}`, import.meta.url)));
  }
});
