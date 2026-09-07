import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { inventoryRecords } from "../../../inventory/catalog.generated";
import { getDb } from "../../../../db";
import { cardMarketCache } from "../../../../db/schema";

export const dynamic = "force-dynamic";

type CatalogRecord = {
  sku: string; name: string; game: string; set: string; number: string;
  language: string; finish: string; condition: string;
};

type PriceSource = {
  id: string; name: string; status: "matched" | "no_match" | "unavailable";
  market: number | null; low: number | null; mid: number | null; high: number | null;
  currency: string; variant: string | null; updatedAt: string | null;
  url: string | null; detail: string;
};

const catalog = inventoryRecords as readonly CatalogRecord[];
const USER_AGENT = "PocketArchivesInventory/1.0 info@pocketarchives.com";
const CACHE_HOURS = 12;

const categoryByGame: Record<string, number[]> = {
  "Magic: The Gathering": [1],
  "Yu-Gi-Oh!": [2],
  "Pokémon": [3, 85],
  "Dragon Ball Z": [23],
  "Dragon Ball Super": [27, 80],
  "One Piece Card Game": [68],
  "Sorcery: Contested Realm": [77],
  Riftbound: [89],
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizedNumber(value: unknown) {
  const text = normalize(value).replace(/^no\s+/, "");
  const first = text.match(/\d+/)?.[0];
  return first ? String(Number(first)) : text;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}

async function fetchJson(url: string, timeoutMs = 8_000) {
  const response = await fetch(url, {
    headers: { Accept: "application/json;q=0.9,*/*;q=0.8", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function setScore(candidate: string, wanted: string) {
  const a = normalize(candidate).replace(/^[a-z0-9]{2,10}\s+/, "");
  const b = normalize(wanted).replace(/\b(?:sv|swsh|sm|xy|bw|dp|ex|m)[a-z0-9]*\b/g, "").trim();
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.endsWith(b) || b.endsWith(a)) return 88;
  if (a.includes(b) || b.includes(a)) return 72;
  const bWords = new Set(b.split(" ").filter((word) => word.length > 2));
  const overlap = a.split(" ").filter((word) => bWords.has(word)).length;
  return overlap ? Math.min(65, overlap * 18) : 0;
}

function finishScore(subtype: string, finish: string) {
  const a = normalize(subtype);
  const b = normalize(finish);
  if (b.includes("reverse")) return a.includes("reverse") ? 30 : -20;
  if (b.includes("etched")) return a.includes("etched") ? 30 : -20;
  if (b.includes("holo") || b.includes("foil")) {
    return (a.includes("holo") || a.includes("foil")) && !a.includes("reverse") ? 25 : -10;
  }
  return a.includes("normal") || a.includes("nonfoil") ? 20 : 0;
}

async function lookupTcgCsv(card: CatalogRecord): Promise<PriceSource> {
  const categories = card.game === "Pokémon" && normalize(card.language).includes("japanese")
    ? [85, 3]
    : categoryByGame[card.game] ?? [];
  if (!categories.length) return emptySource("tcgcsv", "TCGCSV", "no_match", "Game is not in the TCGCSV catalog map.");

  const groupCandidates: { categoryId: number; groupId: number; name: string; score: number }[] = [];
  const groupPayloads = await Promise.all(categories.map(async (categoryId) => ({
    categoryId,
    payload: await fetchJson(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`),
  })));
  for (const { categoryId, payload } of groupPayloads) {
    for (const group of payload?.results ?? []) {
      const score = setScore(group.name, card.set);
      if (score > 0) groupCandidates.push({ categoryId, groupId: Number(group.groupId), name: group.name, score });
    }
  }
  groupCandidates.sort((a, b) => b.score - a.score);
  const shortlisted = groupCandidates.slice(0, 3);
  if (!shortlisted.length) return emptySource("tcgcsv", "TCGCSV / TCGplayer-derived", "no_match", `No set match for ${card.set}.`);

  const wantedName = normalize(card.name);
  const wantedNumber = normalizedNumber(card.number);
  const matches: { product: any; price: any; group: typeof shortlisted[number]; score: number }[] = [];
  await Promise.all(shortlisted.map(async (group) => {
    const [products, prices] = await Promise.all([
      fetchJson(`https://tcgcsv.com/tcgplayer/${group.categoryId}/${group.groupId}/products`),
      fetchJson(`https://tcgcsv.com/tcgplayer/${group.categoryId}/${group.groupId}/prices`),
    ]);
    const pricesByProduct = new Map<number, any[]>();
    for (const row of prices?.results ?? []) {
      const rows = pricesByProduct.get(Number(row.productId)) ?? [];
      rows.push(row); pricesByProduct.set(Number(row.productId), rows);
    }
    for (const product of products?.results ?? []) {
      const productName = normalize(product.cleanName || product.name);
      if (productName !== wantedName && !productName.includes(wantedName) && !wantedName.includes(productName)) continue;
      const printedNumber = normalizedNumber((product.extendedData ?? []).find((item: any) => normalize(item.name) === "number")?.value);
      const numberScore = wantedNumber && printedNumber ? (wantedNumber === printedNumber ? 80 : -60) : 0;
      const nameScore = productName === wantedName ? 60 : 25;
      for (const price of pricesByProduct.get(Number(product.productId)) ?? []) {
        matches.push({ product, price, group, score: group.score + nameScore + numberScore + finishScore(price.subTypeName, card.finish) });
      }
    }
  }));
  matches.sort((a, b) => b.score - a.score);
  const best = matches[0];
  if (!best || best.score < 80) return emptySource("tcgcsv", "TCGCSV / TCGplayer-derived", "no_match", "No high-confidence exact card and variant match.");
  return {
    id: "tcgcsv", name: "TCGCSV / TCGplayer-derived", status: "matched",
    market: numberValue(best.price.marketPrice), low: numberValue(best.price.lowPrice),
    mid: numberValue(best.price.midPrice), high: numberValue(best.price.highPrice), currency: "USD",
    variant: best.price.subTypeName ?? null, updatedAt: null, url: best.product.url ?? null,
    detail: `${best.group.name} · ${best.product.name}`,
  };
}

async function lookupScryfall(card: CatalogRecord): Promise<PriceSource> {
  if (card.game !== "Magic: The Gathering") return emptySource("scryfall", "Scryfall", "no_match", "Magic cards only.");
  const query = encodeURIComponent(`!\"${card.name.replaceAll('"', "")}\"`);
  const payload = await fetchJson(`https://api.scryfall.com/cards/search?q=${query}&unique=prints&order=released`);
  const wantedSet = normalize(card.set);
  const wantedNumber = normalizedNumber(card.number);
  const printings = (payload?.data ?? []).map((item: any) => ({
    item,
    score: setScore(item.set_name, card.set) + (wantedNumber && normalizedNumber(item.collector_number) === wantedNumber ? 80 : 0),
  })).sort((a: any, b: any) => b.score - a.score);
  const best = printings[0]?.item;
  if (!best || (!wantedSet && !wantedNumber)) return emptySource("scryfall", "Scryfall", "no_match", "No exact printing match.");
  const finish = normalize(card.finish);
  const price = finish.includes("etched") ? best.prices?.usd_etched : finish.includes("foil") || finish.includes("holo") ? best.prices?.usd_foil : best.prices?.usd;
  return {
    id: "scryfall", name: "Scryfall", status: "matched", market: numberValue(price),
    low: null, mid: null, high: null, currency: "USD",
    variant: finish.includes("etched") ? "Etched" : finish.includes("foil") || finish.includes("holo") ? "Foil" : "Nonfoil",
    updatedAt: null, url: best.scryfall_uri ?? null,
    detail: `${best.set_name} · ${best.collector_number}${best.lang ? ` · ${String(best.lang).toUpperCase()}` : ""}`,
  };
}

async function lookupPokemonApi(card: CatalogRecord): Promise<PriceSource> {
  if (card.game !== "Pokémon" || normalize(card.language) !== "english") return emptySource("pokemon-tcg-api", "Pokémon TCG API", "no_match", "English Pokémon cards only.");
  const clauses = [`name:\"${card.name.replaceAll('"', "")}\"`];
  if (normalizedNumber(card.number)) clauses.push(`number:${normalizedNumber(card.number)}`);
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(clauses.join(" "))}&pageSize=20`;
  const payload = await fetchJson(url, 6_000);
  const cards = (payload?.data ?? []).map((item: any) => ({ item, score: setScore(item.set?.name, card.set) })).sort((a: any, b: any) => b.score - a.score);
  const best = cards[0]?.item;
  if (!best) return emptySource("pokemon-tcg-api", "Pokémon TCG API", "no_match", "No exact card match.");
  const prices = best.tcgplayer?.prices ?? {};
  const finish = normalize(card.finish);
  const variantKey = finish.includes("reverse") ? "reverseHolofoil" : finish.includes("holo") || finish.includes("foil") ? "holofoil" : "normal";
  const selected = prices[variantKey] ?? Object.values(prices)[0] ?? {};
  return {
    id: "pokemon-tcg-api", name: "Pokémon TCG API", status: "matched",
    market: numberValue((selected as any).market), low: numberValue((selected as any).low),
    mid: numberValue((selected as any).mid), high: numberValue((selected as any).high), currency: "USD",
    variant: variantKey, updatedAt: best.tcgplayer?.updatedAt ?? null,
    url: best.tcgplayer?.url ?? null, detail: `${best.set?.name ?? card.set} · ${best.number ?? card.number}`,
  };
}

function emptySource(id: string, name: string, status: PriceSource["status"], detail: string): PriceSource {
  return { id, name, status, market: null, low: null, mid: null, high: null, currency: "USD", variant: null, updatedAt: null, url: null, detail };
}

async function safeLookup(id: string, name: string, lookup: () => Promise<PriceSource>) {
  try { return await lookup(); }
  catch (error) { return emptySource(id, name, "unavailable", error instanceof Error ? error.message : "Connection failed"); }
}

async function buildSnapshot(card: CatalogRecord) {
  const sources = await Promise.all([
    safeLookup("tcgcsv", "TCGCSV / TCGplayer-derived", () => lookupTcgCsv(card)),
    safeLookup("scryfall", "Scryfall", () => lookupScryfall(card)),
    safeLookup("pokemon-tcg-api", "Pokémon TCG API", () => lookupPokemonApi(card)),
  ]);
  const matched = sources.filter((source) => source.status === "matched" && source.market !== null);
  const markets = matched.map((source) => source.market!).sort((a, b) => a - b);
  const consensus = markets.length ? markets[Math.floor(markets.length / 2)] : null;
  return {
    sku: card.sku, card: { name: card.name, set: card.set, number: card.number, language: card.language, finish: card.finish, condition: card.condition },
    fetchedAt: new Date().toISOString(), consensusMarket: consensus, matchedSources: matched.length, sources,
    warning: matched.length ? "Guide prices are supporting evidence. Condition and exact variant still control the final listing price." : "No automated exact match. Manual comp research is required.",
  };
}

async function authorize() {
  const user = await getChatGPTUser();
  const owner = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  return user && user.email.toLowerCase() === owner;
}

export async function GET(request: NextRequest) {
  if (!(await authorize())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sku = request.nextUrl.searchParams.get("sku")?.trim() ?? "";
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  const card = catalog.find((item) => item.sku === sku);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const db = getDb();
  if (!force) {
    const cached = await db.select().from(cardMarketCache).where(eq(cardMarketCache.sku, sku)).get();
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      return NextResponse.json({ ...JSON.parse(cached.payloadJson), cached: true });
    }
  }

  const payload = await buildSnapshot(card);
  const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
  await db.insert(cardMarketCache).values({ sku, payloadJson: JSON.stringify(payload), fetchedAt: payload.fetchedAt, expiresAt })
    .onConflictDoUpdate({ target: cardMarketCache.sku, set: { payloadJson: JSON.stringify(payload), fetchedAt: payload.fetchedAt, expiresAt } });
  return NextResponse.json({ ...payload, cached: false });
}
