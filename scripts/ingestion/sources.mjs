import { normalizeIdentity } from "./identity.mjs";

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { Accept: "application/json", "User-Agent": "PocketArchives-Ingestion/1.0", ...(options.headers ?? {}) }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const exact = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
const result = (source, guess, identity, externalId, raw) => ({
  source, identity: normalizeIdentity(identity), externalId, raw,
  exactNumber: exact(guess.cardNumber, identity.cardNumber),
  exactSet: exact(guess.setCode || guess.setName, identity.setCode || identity.setName),
  exactLanguage: exact(guess.language, identity.language),
  exactFinish: exact(guess.finish, identity.finish),
  verified: true,
});

async function verifyMagic(guess) {
  const query = guess.setCode && guess.cardNumber
    ? `https://api.scryfall.com/cards/${encodeURIComponent(guess.setCode.toLowerCase())}/${encodeURIComponent(guess.cardNumber)}`
    : `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(guess.name)}`;
  const card = await fetchJson(query);
  const finish = guess.finish || (card.foil && !card.nonfoil ? "Foil" : "Non-Foil");
  const verified = result("scryfall", guess, { game: "Magic: The Gathering", name: card.name, setName: card.set_name, setCode: card.set?.toUpperCase(), cardNumber: card.collector_number, language: card.lang === "en" ? "English" : card.lang, finish, rarity: card.rarity }, card.id, card);
  verified.exactFinish = card.finishes?.some((value) => value.replace("nonfoil", "Non-Foil").toLowerCase() === finish.toLowerCase()) ?? false;
  return verified;
}

async function verifyPokemon(guess) {
  const terms = [`number:${JSON.stringify(guess.cardNumber)}`, `name:${JSON.stringify(guess.name)}`];
  if (guess.setName) terms.push(`set.name:${JSON.stringify(guess.setName)}`);
  const payload = await fetchJson(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(terms.join(" "))}&pageSize=10`, process.env.POKEMON_TCG_API_KEY ? { headers: { "X-Api-Key": process.env.POKEMON_TCG_API_KEY } } : {});
  if (payload.count !== 1) throw new Error(`Expected one exact Pokémon catalog result, received ${payload.count ?? 0}`);
  const card = payload.data[0];
  const verified = result("pokemon-tcg-api", guess, { game: "Pokémon", name: card.name, setName: card.set?.name, setCode: card.set?.id, cardNumber: card.number, language: "English", finish: guess.finish, rarity: card.rarity }, card.id, card);
  verified.exactFinish = guess.finishVerified === true;
  return verified;
}

async function verifyYugioh(guess) {
  const payload = await fetchJson(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(guess.name)}`);
  const cards = payload.data ?? [];
  const match = cards.flatMap((card) => (card.card_sets ?? []).map((printing) => ({ card, printing }))).find(({ printing }) => exact(printing.set_code, guess.setCode));
  if (!match) throw new Error("No exact Yu-Gi-Oh name and set-code match");
  const verified = result("ygoprodeck", guess, { game: "Yu-Gi-Oh!", name: match.card.name, setName: match.printing.set_name, setCode: match.printing.set_code, cardNumber: guess.cardNumber || match.printing.set_code, language: guess.language, finish: guess.finish, rarity: match.printing.set_rarity }, String(match.card.id), match);
  verified.exactFinish = guess.finishVerified === true;
  return verified;
}

export async function verifyIdentity(guess) {
  try {
    if (/magic/i.test(guess.game)) return await verifyMagic(guess);
    if (/pok[eé]mon/i.test(guess.game) && /^english$/i.test(guess.language)) return await verifyPokemon(guess);
    if (/yu-?gi-?oh/i.test(guess.game)) return await verifyYugioh(guess);
    return { source: null, verified: false, identity: null, reason: "NO_APPROVED_CATALOG_FOR_GAME_LANGUAGE" };
  } catch (error) {
    return { source: null, verified: false, identity: null, reason: "CATALOG_LOOKUP_FAILED", error: error instanceof Error ? error.message : String(error) };
  }
}
