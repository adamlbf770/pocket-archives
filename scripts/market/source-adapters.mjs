const DEFAULT_TIMEOUT_MS = 12_000;

export async function fetchJson(url, { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PocketArchives-SourceHealth/1.0",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export const sourceAdapters = {
  tcgcsv: {
    sourceId: "tcgcsv",
    async probe(options = {}) {
      const payload = await fetchJson("https://tcgcsv.com/tcgplayer/categories", options);
      const records = Array.isArray(payload?.results) ? payload.results.length : 0;
      if (!payload?.success || records === 0) throw new Error("No trading-card categories returned");
      const supported = payload.results.filter((item) => [1, 2, 3, 23, 27, 68, 77, 80, 85, 89].includes(Number(item.categoryId)));
      return { records: supported.length, detail: `${supported.length} supported game catalogs available in the daily cache` };
    },
  },
  pokemonTcgApi: {
    sourceId: "pokemon-tcg-api",
    async probe(options = {}) {
      const payload = await fetchJson("https://api.pokemontcg.io/v2/sets?pageSize=1", options);
      const records = Array.isArray(payload?.data) ? payload.data.length : 0;
      if (records !== 1) throw new Error("Reference set lookup failed");
      return { records, detail: "English card identity and set lookup is reachable" };
    },
  },
  scryfall: {
    sourceId: "scryfall",
    async probe(options = {}) {
      const payload = await fetchJson("https://api.scryfall.com/cards/named?exact=Black+Lotus", options);
      if (payload?.object !== "card" || !payload?.name) throw new Error("Reference card lookup failed");
      return { records: 1, detail: "Exact Magic printing and USD price lookup is reachable" };
    },
  },
};

export async function probeSource(adapter, options = {}) {
  const checkedAt = new Date().toISOString();
  try {
    const result = await adapter.probe(options);
    return { sourceId: adapter.sourceId, status: "connected", checkedAt, ...result, error: null };
  } catch (error) {
    return {
      sourceId: adapter.sourceId,
      status: "attention",
      checkedAt,
      records: 0,
      detail: "Connection check failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
