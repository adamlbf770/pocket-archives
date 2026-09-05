import { inventoryRecords } from "./inventory/catalog.generated";

export type PublicEbayListing = {
  sku: string;
  name: string;
  game: string;
  set: string;
  number: string;
  year: number | null;
  language: string;
  finish: string;
  condition: string;
  rarity: string;
  artist: string;
  price: number;
  listingId: string;
  listingUrl: string;
  frontImage: string;
};

function displayGame(record: (typeof inventoryRecords)[number]) {
  if (/\/itm\/Riftbound-/i.test(record.listingUrl || "")) return "Riftbound";
  return record.game;
}

export const publicEbayListings: PublicEbayListing[] = inventoryRecords
  .filter(
    (record) =>
      record.status === "Listed" &&
      Boolean(record.listingId && record.listingUrl && record.frontImage) &&
      typeof record.price === "number",
  )
  .map((record) => ({
    sku: record.sku,
    name: record.name,
    game: displayGame(record),
    set: record.set,
    number: record.number,
    year: record.year,
    language: record.language,
    finish: record.finish,
    condition: record.condition,
    rarity: record.rarity,
    artist: record.artist,
    price: record.price as number,
    listingId: record.listingId as string,
    listingUrl: record.listingUrl as string,
    frontImage: record.frontImage as string,
  }))
  .sort((a, b) => Number(b.listingId) - Number(a.listingId));

export function featuredEbayListings() {
  const graded = publicEbayListings.filter((item) => item.condition === "Graded");
  const vintage = publicEbayListings.filter(
    (item) => item.game === "Pokémon" && Boolean(item.year && item.year <= 2003),
  );
  const magic = publicEbayListings.filter((item) => item.game === "Magic: The Gathering");
  const dragonBall = publicEbayListings.filter((item) => item.game === "Dragon Ball Super");
  const candidates = [graded[0], vintage[0], magic[0], dragonBall[0], ...publicEbayListings];
  return candidates
    .filter((item): item is PublicEbayListing => Boolean(item))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.sku === item.sku) === index)
    .slice(0, 8);
}

export function storefrontCounts() {
  return publicEbayListings.reduce<Record<string, number>>((counts, item) => {
    counts[item.game] = (counts[item.game] || 0) + 1;
    return counts;
  }, {});
}

export function storefrontCatalogListings() {
  const selection = new Map<string, PublicEbayListing>();
  publicEbayListings.slice(0, 240).forEach((item) => selection.set(item.sku, item));
  Object.keys(storefrontCounts()).forEach((game) => {
    publicEbayListings
      .filter((item) => item.game === game)
      .slice(0, 180)
      .forEach((item) => selection.set(item.sku, item));
  });
  return [...selection.values()].sort((a, b) => Number(b.listingId) - Number(a.listingId));
}
