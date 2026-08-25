import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inventoryRoot = path.join(root, "inventory");
const ordersPath = path.join(root, "data", "ebay", "orders.json");
const counterfeitExclusionsPath = path.join(inventoryRoot, "Counterfeit Exclusions.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, ""));
  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function first(row, keys) {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return "";
}

function isNonHolo(finish) {
  const normalized = finish.toLowerCase().replaceAll(" ", "-");
  return ["regular", "normal", "non-holo", "nonholo"].some((value) => normalized.includes(value));
}

function normalizeText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isPokemonGame(game) {
  return normalizeText(game).includes("pokemon");
}

function isFoil(finish) {
  const normalized = finish.toLowerCase().replaceAll(" ", "-");
  const explicitlyNonFoil = normalized.includes("non-holo") || normalized.includes("nonholo") || normalized.includes("non-foil");
  return !explicitlyNonFoil && (normalized.includes("holo") || normalized.includes("foil"));
}

const allManifestCards = walk(inventoryRoot)
  .filter((file) => file.endsWith("Manifest.csv"))
  .flatMap((file) =>
    parseCsv(fs.readFileSync(file, "utf8")).map((row) => {
      const source = path.relative(root, file);
      const inferredGame = source.includes("Sorcery")
        ? "Sorcery: Contested Realm"
        : source.includes("Dragon Ball")
          ? "Dragon Ball Super Card Game"
          : source.includes("Magic")
            ? "Magic: The Gathering"
            : "Pokemon";
      return {
        sku: first(row, ["sku", "SKU"]),
        name: first(row, ["name", "Card Name", "Card"]),
        set: first(row, ["set", "Set"]),
        number: first(row, ["number", "Card Number"]),
        year: Number(first(row, ["year", "Year"])),
        language: first(row, ["language", "Language"]),
        finish: first(row, ["finish", "Variant/Finish", "Finish"]) || "Regular",
        game: first(row, ["game", "Game"]) || inferredGame,
        status: ["status", "ebayStatus", "Inventory Status", "Listing Status", "Status"]
          .map((key) => row[key]?.trim())
          .filter(Boolean)
          .join(" | "),
        inventoryLocation: first(row, ["inventoryLocation", "Inventory Location", "Box"]),
        source,
      };
    }),
  )
  .filter((card) => card.sku);

const manifestCards = allManifestCards
  .filter((card) => card.inventoryLocation !== "Box 5")
  .filter((card) => isPokemonGame(card.game))
  .filter((card) => card.language === "English" || card.language === "Japanese")
  .filter((card) => card.year >= 1996 && card.year <= 2003)
  .filter((card) => isNonHolo(card.finish))
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status));

const legacyCards = [
  ["PA-0013", "Marill", "Expedition Base Set", "120/165", 2002, "English"],
  ["PA-0014", "Hypno", "Pocket Monsters Carddass", "097", 1997, "Japanese"],
  ["PA-0015", "Slowbro", "Pocket Monsters Carddass", "080", 1997, "Japanese"],
  ["PA-0020", "Ledyba", "Neo Genesis", "63/111", 2000, "English"],
  ["PA-0021", "Vileplume", "Jungle", "31/64", 1999, "English"],
  ["PA-0022", "Seel", "Neo Destiny", "81/105", 2002, "English"],
  ["PA-0023", "Misty's Horsea", "Gym Challenge", "87/132", 2000, "English"],
  ["PA-0024", "Tyrogue", "The Town on No Map", "055/092", 2002, "Japanese"],
  ["PA-0025", "Omanyte", "EX Sandstorm", "70/100", 2003, "English"],
  ["PA-0026", "Treecko", "EX Ruby & Sapphire", "75/109", 2003, "English"],
  ["PA-0027", "Poochyena", "EX Ruby & Sapphire", "63/109", 2003, "English"],
  ["PA-0028", "Croconaw", "Neo Premium File 1", "No.159", 1999, "Japanese"],
  ["PA-0030", "Totodile", "Neo Premium File 1", "No.158", 1999, "Japanese"],
  ["PA-0033", "Magby", "Neo Genesis", "23/111", 2000, "English"],
  ["PA-0034", "Kangaskhan", "Jungle", "21/64", 1999, "English"],
  ["PA-0035", "Cleffa", "Gold, Silver, to a New World…", "No.173", 2000, "Japanese"],
  ["PA-0037", "Vigoroth", "EX Ruby & Sapphire", "47/109", 2003, "English"],
  ["PA-0038", "Dark Primeape", "Team Rocket", "43/82", 2000, "English"],
  ["PA-0039", "Light Sunflora", "Neo Destiny", "72/105", 2002, "English"],
  ["PA-0040", "Wigglytuff", "Bandai Carddass Pocket Monsters", "No.040", 1996, "Japanese"],
].map(([sku, name, set, number, year, language]) => ({
  sku,
  name,
  set,
  number,
  year,
  language,
  finish: "Non-Holo",
  status: "Legacy catalog record",
  source: "app/shop/catalog.ts",
}));

const knownLegacySkuByItemId = new Map([
  ["158193192382", "PA-0024"],
  ["158193187928", "PA-0025"],
]);
const orderPayload = fs.existsSync(ordersPath)
  ? JSON.parse(fs.readFileSync(ordersPath, "utf8"))
  : { orders: [] };
const soldAndShippedSkus = new Set(
  (orderPayload.orders || [])
    .filter((order) => order.orderFulfillmentStatus === "FULFILLED")
    .flatMap((order) => order.lineItems || [])
    .map((line) => line.sku || knownLegacySkuByItemId.get(line.legacyItemId) || "")
    .filter(Boolean),
);
const counterfeitExclusions = fs.existsSync(counterfeitExclusionsPath)
  ? JSON.parse(fs.readFileSync(counterfeitExclusionsPath, "utf8"))
  : { items: [] };
const excludedSkus = new Set((counterfeitExclusions.items || []).map((item) => item.sku).filter(Boolean));

const cardsBySku = new Map([...manifestCards, ...legacyCards].map((card) => [card.sku, card]));
const box1Cards = [...cardsBySku.values()]
  .filter((card) => !soldAndShippedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .sort((a, b) => a.sku.localeCompare(b.sku));

const batch15MappingPath = path.join(
  inventoryRoot,
  "Batch 15 - Magic - PA-1354-PA-1452",
  "Batch 15 Scan Mapping.csv",
);
const batch15Cards = parseCsv(fs.readFileSync(batch15MappingPath, "utf8")).map((row) => ({
  sku: row.SKU,
  name: "Identification pending",
  set: "Identification pending",
  number: "",
  year: null,
  language: "English",
  finish: "Unverified",
  game: "Magic: The Gathering",
  status: "Local only — identification pending",
  source: path.relative(root, batch15MappingPath),
}));

const box2ManifestCards = allManifestCards
  .filter((card) =>
    ["magic: the gathering", "dragon ball super card game", "sorcery: contested realm"].includes(
      card.game.toLowerCase(),
    ),
  )
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status));
const box2Cards = [
  // Keep the scan placeholders as a fallback, but let completed manifests win.
  ...new Map([...batch15Cards, ...box2ManifestCards].map((card) => [card.sku, card])).values(),
].filter((card) => !soldAndShippedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .sort((a, b) => a.sku.localeCompare(b.sku));

const physicallyDepartedSkus = new Set([
  "PA-0018", // Heliolisk — sold and shipped
  "PA-0197", // Ditto — sold and shipped
  ...soldAndShippedSkus,
]);

const box3LegacyCards = [
  ["PA-0016", "Delibird", "Mega Evolution", "152/132", 2025, "English", "Holofoil"],
  ["PA-0017", "Doublade", "Perfect Order", "098/088", 2026, "English", "Holofoil"],
  ["PA-0019", "Zarude", "M5: Abyss Eye", "090/081", 2026, "Japanese", "Holofoil"],
].map(([sku, name, set, number, year, language, finish]) => ({
  sku,
  name,
  set,
  number,
  year,
  language,
  finish,
  game: "Pokemon",
  status: "Legacy catalog record",
  source: "app/shop/catalog.ts",
}));

const box3ManifestCards = allManifestCards
  .filter((card) => card.inventoryLocation !== "Box 5")
  .filter((card) => isPokemonGame(card.game))
  .filter((card) => card.year >= 2004)
  .filter((card) => isFoil(card.finish))
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status))
  .filter((card) => !physicallyDepartedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku));
const box3Cards = [
  ...new Map([...box3ManifestCards, ...box3LegacyCards].map((card) => [card.sku, card])).values(),
].sort((a, b) => a.sku.localeCompare(b.sku));

const box4Cards = allManifestCards
  .filter((card) => card.inventoryLocation !== "Box 5")
  .filter((card) => isPokemonGame(card.game))
  .filter((card) => card.year >= 2004)
  .filter((card) => isNonHolo(card.finish))
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status))
  .filter((card) => !physicallyDepartedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .sort((a, b) => a.sku.localeCompare(b.sku));

const box5Cards = allManifestCards
  .filter((card) => card.inventoryLocation === "Box 5")
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status))
  .filter((card) => !physicallyDepartedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .sort((a, b) => a.sku.localeCompare(b.sku));

const box6Cards = allManifestCards
  .filter((card) => card.inventoryLocation === "Box 6")
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status))
  .filter((card) => !physicallyDepartedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .sort((a, b) => a.sku.localeCompare(b.sku));

const assignedSkus = new Set(
  [...box1Cards, ...box2Cards, ...box3Cards, ...box4Cards, ...box5Cards, ...box6Cards].map((card) => card.sku),
);
const unassignedCards = allManifestCards
  .filter((card) => !assignedSkus.has(card.sku))
  .filter((card) => !soldAndShippedSkus.has(card.sku))
  .filter((card) => !excludedSkus.has(card.sku))
  .filter((card) => !/(sold|shipped|removed|excluded|do not list)/i.test(card.status))
  // Batch 16's vintage holo Clefairy has not yet been placed in a physical box.
  .filter((card) => card.sku === "PA-1453")
  .sort((a, b) => a.sku.localeCompare(b.sku));

const output = {
  version: 1,
  updatedAt: "2026-08-23",
  boxes: [
    {
      id: "BOX-1",
      label: "Box 1",
      description: "Vintage Bulk — English and Japanese non-holo Pokémon cards",
      physicalSort: "Pokémon type, then Trainer, then Energy",
      inclusionRule: {
        games: ["Pokemon TCG", "Pokemon collectible cards"],
        languages: ["English", "Japanese"],
        years: { from: 1996, through: 2003 },
        finishes: ["Regular", "Non-Holo"],
        excluded: ["Holofoil", "Reverse Holo", "Modern cards (2004 and later)"],
      },
      cardCount: box1Cards.length,
    },
    {
      id: "BOX-2",
      label: "Box 2",
      description: "Magic: The Gathering, Dragon Ball, and Sorcery cards",
      physicalSort: "Grouped by game",
      inclusionRule: {
        games: ["Magic: The Gathering", "Dragon Ball Super Card Game", "Sorcery: Contested Realm"],
        languages: ["All"],
        years: "All",
        finishes: ["All"],
        excluded: ["Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: box2Cards.length,
    },
    {
      id: "BOX-3",
      label: "Box 3",
      description: "Modern Pokémon holos and reverse holos",
      physicalSort: "Pokémon type, then Trainer, then Energy",
      inclusionRule: {
        games: ["Pokemon TCG", "Pokemon collectible cards"],
        languages: ["All"],
        years: { from: 2004, through: "Present" },
        finishes: ["Holofoil", "Holo", "Reverse Holo", "Other foil treatments"],
        excluded: ["Non-holo cards", "Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: box3Cards.length,
    },
    {
      id: "BOX-4",
      label: "Box 4",
      description: "Modern Bulk #1 — modern non-holo Pokémon cards",
      physicalSort: "Pokémon type, then Trainer, then Energy",
      inclusionRule: {
        games: ["Pokemon TCG", "Pokemon collectible cards"],
        languages: ["All"],
        years: { from: 2004, through: "Present" },
        finishes: ["Regular", "Non-Holo"],
        excluded: ["Holofoil", "Reverse Holo", "Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: box4Cards.length,
    },
    {
      id: "BOX-5",
      label: "Box 5",
      description: "Batch 18 — PA-1816 through PA-2590",
      physicalSort: "Batch/SKU order unless physically reorganized",
      inclusionRule: {
        skus: { from: "PA-1816", through: "PA-2590" },
        games: ["Pokemon TCG"],
        finishes: ["All"],
        excluded: ["Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: box5Cards.length,
    },
    {
      id: "BOX-6",
      label: "Box 6",
      description: "Batch 19 — PA-2591 through PA-3408",
      physicalSort: "Batch/SKU order unless physically reorganized",
      inclusionRule: {
        skus: { from: "PA-2591", through: "PA-3408" },
        games: ["Pokemon TCG"],
        finishes: ["All"],
        excluded: ["Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: box6Cards.length,
    },
    {
      id: "BOX-UNASSIGNED",
      label: "Unassigned",
      description: "Cataloged inventory awaiting a confirmed physical box",
      physicalSort: "Assign a box before filing",
      inclusionRule: {
        games: ["All"],
        finishes: ["All"],
        excluded: ["Sold, shipped, removed, or explicitly excluded inventory"],
      },
      cardCount: unassignedCards.length,
    },
  ],
  assignments: [
    ...box1Cards.map((card) => ({ ...card, boxId: "BOX-1" })),
    ...box2Cards.map((card) => ({ ...card, boxId: "BOX-2" })),
    ...box3Cards.map((card) => ({ ...card, boxId: "BOX-3" })),
    ...box4Cards.map((card) => ({ ...card, boxId: "BOX-4" })),
    ...box5Cards.map((card) => ({ ...card, boxId: "BOX-5" })),
    ...box6Cards.map((card) => ({ ...card, boxId: "BOX-6" })),
    ...unassignedCards.map((card) => ({ ...card, boxId: "BOX-UNASSIGNED" })),
  ],
};

const outputPath = path.join(inventoryRoot, "Storage Locations.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Wrote ${box1Cards.length} Box 1, ${box2Cards.length} Box 2, ${box3Cards.length} Box 3, ${box4Cards.length} Box 4, ${box5Cards.length} Box 5, ${box6Cards.length} Box 6, and ${unassignedCards.length} unassigned records to ${path.relative(root, outputPath)}`,
);
