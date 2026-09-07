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
      const payload = await fetchJson("https://tcgcsv.com/tcgplayer/3/groups", options);
      const records = Array.isArray(payload?.results) ? payload.results.length : 0;
      if (!payload?.success || records === 0) throw new Error("No Pokémon groups returned");
      return { records, detail: `${records.toLocaleString()} Pokémon sets available in the daily cache` };
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
