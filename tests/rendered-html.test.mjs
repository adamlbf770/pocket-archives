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

test("server-renders batch 05 listings with the verified prices and conditions", async () => {
  const listings = [
    ["vigoroth-ex-ruby-sapphire-47-109", "$0.99", "Moderately Played"],
    ["dark-primeape-team-rocket-43-82-first-edition", "$3.49", "Moderately Played"],
    ["light-sunflora-neo-destiny-72-105-first-edition", "$1.49", "Moderately Played"],
    ["wigglytuff-1996-bandai-carddass-green-040", "$10.99", "Near Mint"],
  ];

  for (const [slug, price, condition] of listings) {
    const response = await render(`/objects/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(condition, "i"));
    assert.match(html, new RegExp(price.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /batch-05\/pa-00(?:37|38|39|40)-(?:front|back)\.jpg/i);
  }
});
