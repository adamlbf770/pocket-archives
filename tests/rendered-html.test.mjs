import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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

test("early archive records expose audited provenance without invented plate numbers", async () => {
  const source = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /Prototype artwork plate/);
  assert.doesNotMatch(source, /Carddass action archive sheet/);
  assert.doesNotMatch(source, /Beta sprite specimen/);
  assert.match(source, /c\. 1993/);
  assert.match(source, /Provenance \+ verification/i);
  assert.match(source, /ATTRIBUTION UNVERIFIED/);
  assert.match(source, /1990 source material · 2019 reconstruction/);
  assert.match(source, /1997 · Parts 3 and 4/);
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

test("server-renders all batch 04 shop listings with their scanned fronts", async () => {
  const response = await render("/shop");
  assert.equal(response.status, 200);

  const html = await response.text();
  for (const title of [
    "Croconaw",
    "Tentacruel",
    "Totodile",
    "Magneton",
    "Ampharos",
    "Magby",
    "Kangaskhan",
    "Cleffa",
    "Scizor",
  ]) {
    assert.match(html, new RegExp(`>${title}<`, "i"));
  }
  for (let catalogNumber = 28; catalogNumber <= 36; catalogNumber += 1) {
    const filename = `pa-${String(catalogNumber).padStart(4, "0")}-front.jpg`;
    assert.match(html, new RegExp(filename, "i"));
  }
  for (const set of [
    "Neo Premium File 1",
    "Southern Islands",
    "Awakening Legends",
    "Wizards Black Star Promos",
  ]) {
    assert.match(html, new RegExp(set, "i"));
  }
  assert.match(html, /Expansion Pack \(Japanese Base Set\)<!-- --> · <!-- -->Holo Rare/i);
  assert.match(html, /Neo Genesis<!-- --> · <!-- -->Rare/i);
  assert.match(html, /Southern Islands<!-- --> · <!-- -->Promo/i);
  assert.match(html, />Holo Rare<\/option>/i);
  assert.match(html, />Rare<\/option>/i);
  assert.match(html, />Promo<\/option>/i);
  assert.doesNotMatch(html, /Rarity not listed/i);
  assert.match(html, /class="store-rarity-groups"/i);
  assert.match(html, /class="store-rarity-heading"/i);
});

test("batch 04 object pages show moderately played condition and revised prices", async () => {
  const listings = [
    ["croconaw-neo-premium-file-1-no-159", "$2.49"],
    ["tentacruel-southern-islands-10-18", "$29.99"],
    ["totodile-neo-premium-file-1-no-158", "$2.49"],
    ["magneton-japanese-base-set-no-082-holo", "$8.49"],
    ["ampharos-awakening-legends-no-181-holo", "$14.99"],
    ["magby-neo-genesis-23-111", "$3.49"],
    ["kangaskhan-jungle-21-64-unlimited", "$3.49"],
    ["cleffa-japanese-neo-genesis-no-173", "$3.99"],
    ["scizor-wizards-black-star-promo-33", "$9.99"],
  ];

  for (const [slug, price] of listings) {
    const response = await render(`/objects/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Moderately Played/i);
    assert.match(html, new RegExp(price.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
