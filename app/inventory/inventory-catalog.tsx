"use client";

import { useEffect, useRef, useState } from "react";

type Box = { id: string; label: string; description: string; cardCount: number };
type Record = {
  sku: string; name: string; game: string; set: string; number: string;
  year: number | null; language: string; finish: string; condition: string;
  rarity: string; artist: string; boxId: string; box: string; status: string;
  price: number | null; listingId: string | null; listingUrl: string | null;
  market: null | {
    currentPrice: number | null; currentPriceKind: string | null; source: string | null;
    updatedAt: string | null; activeCompMedian: number | null;
    activeCompLow: number | null; activeCompHigh: number | null; activeCompCount: number;
    lastSoldPrice: number | null; lastSoldAt: string | null; lastSoldQuantity: number | null;
  };
  frontImage: string | null; backImage: string | null;
};

const money = (value: number | null) => value === null ? "—" : `$${value.toFixed(2)}`;
const shortDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "—";

type LiveUpdate = {
  sku: string; status: string; price: number | null;
  listingId: string | null; listingUrl: string | null;
};

type SyncPayload = {
  error?: string;
  rows?: LiveUpdate[];
  sync?: { updatedAt: string } | null;
  summary?: { activeCount: number; soldCount: number; updatedAt: string };
};

type LivePriceSource = {
  id: string; name: string; status: "matched" | "no_match" | "unavailable";
  market: number | null; low: number | null; mid: number | null; high: number | null;
  currency: string; variant: string | null; updatedAt: string | null;
  url: string | null; detail: string;
};

type LiveMarket = {
  sku: string; fetchedAt: string; consensusMarket: number | null;
  matchedSources: number; sources: LivePriceSource[]; warning: string; cached?: boolean;
};

export default function InventoryCatalog({ boxes, records, summary, games, statuses, ownerName }: {
  boxes: readonly Box[];
  records: readonly Record[];
  summary: { totalCards: number; listed: number; unlisted: number; listedValue: number };
  games: readonly string[];
  statuses: readonly string[];
  ownerName: string;
}) {
  const [inventory, setInventory] = useState<readonly Record[]>(records);
  const [query, setQuery] = useState("");
  const [box, setBox] = useState("all");
  const [game, setGame] = useState("all");
  const [status, setStatus] = useState("all");
  const [visible, setVisible] = useState(30);
  const [selected, setSelected] = useState<Record | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncAt, setSyncAt] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [liveMarkets, setLiveMarkets] = useState<{ [sku: string]: LiveMarket }>({});
  const [marketLoadingSku, setMarketLoadingSku] = useState<string | null>(null);
  const [inventorySummary, setInventorySummary] = useState(summary);
  const [totalResults, setTotalResults] = useState(summary.totalCards);
  const [searching, setSearching] = useState(false);
  const [searchRevision, setSearchRevision] = useState(0);
  const firstSearch = useRef(true);
  const hasFilters = Boolean(query.trim()) || box !== "all" || game !== "all" || status !== "all";

  useEffect(() => {
    if (firstSearch.current && !query && box === "all" && game === "all" && status === "all" && visible === 30 && searchRevision === 0) {
      firstSearch.current = false;
      return;
    }
    firstSearch.current = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const parameters = new URLSearchParams({ q: query, box, game, status, limit: String(visible) });
        if (searchRevision) parameters.set("fresh", "1");
        const response = await fetch(`/api/inventory/search?${parameters}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json() as { records?: Record[]; total?: number; summary?: typeof summary; error?: string };
        if (!response.ok) throw new Error(payload.error || "Search failed.");
        setInventory(payload.records ?? []);
        setTotalResults(payload.total ?? 0);
        if (payload.summary) setInventorySummary(payload.summary);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSyncMessage(error instanceof Error ? error.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, query.trim() ? 220 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, box, game, status, visible, searchRevision]);

  useEffect(() => {
    if (!selected || liveMarkets[selected.sku]) return;
    void loadLiveMarket(selected.sku, false);
  }, [selected?.sku]);

  const filtered = inventory;

  function resetLimit() { setVisible(30); }
  function clearFilters() { setQuery(""); setBox("all"); setGame("all"); setStatus("all"); resetLimit(); }

  async function refreshInventory() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/inventory/sync?compact=1", { method: "POST", cache: "no-store" });
      const payload = await response.json() as SyncPayload;
      if (!response.ok) throw new Error(payload.error || "Refresh failed.");
      const updatedAt = payload.summary?.updatedAt ?? new Date().toISOString();
      setSyncAt(updatedAt);
      setSyncMessage(`Synced ${payload.summary?.activeCount.toLocaleString() ?? 0} active listings and ${payload.summary?.soldCount.toLocaleString() ?? 0} recent sold cards.`);
      setSearchRevision((value) => value + 1);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function loadLiveMarket(sku: string, force: boolean) {
    setMarketLoadingSku(sku);
    try {
      const response = await fetch(`/api/market/card?sku=${encodeURIComponent(sku)}${force ? "&refresh=1" : ""}`, { cache: "no-store" });
      const payload = await response.json() as LiveMarket & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Market lookup failed.");
      setLiveMarkets((current) => ({ ...current, [sku]: payload }));
    } catch (error) {
      setLiveMarkets((current) => ({ ...current, [sku]: {
        sku, fetchedAt: new Date().toISOString(), consensusMarket: null, matchedSources: 0, sources: [],
        warning: error instanceof Error ? error.message : "Market lookup failed.",
      } }));
    } finally {
      setMarketLoadingSku((current) => current === sku ? null : current);
    }
  }

  return (
    <main className="inventory-app-shell">
      <aside className="inventory-sidebar">
        <a className="inventory-app-brand" href="/inventory">
          <span className="inventory-mark" aria-hidden="true"><i /></span>
          <span><b>Pocket Archives</b><small>Inventory OS</small></span>
        </a>
        <nav aria-label="Pocket Archives app">
          <a className="is-active" href="/inventory"><span aria-hidden="true">⌂</span>Dashboard</a>
          <a href="#card-search"><span aria-hidden="true">⌕</span>Find a card</a>
          <a href="/market"><span aria-hidden="true">↗</span>Market</a>
          <a href="/source-health"><span aria-hidden="true">◉</span>Source health</a>
        </nav>
        <div className="inventory-sidebar-footer">
          <a href="https://www.ebay.com/str/pocketarchives" target="_blank" rel="noreferrer">Open eBay store ↗</a>
          <span>{ownerName}</span>
        </div>
      </aside>

      <section className="inventory-workspace">
        <header className="inventory-app-header">
          <div><small>OVERVIEW</small><h1>Inventory</h1></div>
          <div className="inventory-sync-control">
            <span className="inventory-live-status"><i /> {syncAt ? `Updated ${shortDate(syncAt)}` : "Refresh recommended"}</span>
            <button type="button" onClick={refreshInventory} disabled={syncing} aria-busy={syncing}>
              <span aria-hidden="true">↻</span>{syncing ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </header>
        {syncMessage && <div className="inventory-sync-message" role="status">{syncMessage}</div>}

        <section className="inventory-stat-grid" aria-label="Inventory summary">
          <article><span>Total cards</span><b>{inventorySummary.totalCards.toLocaleString()}</b><small>Across {boxes.length} storage locations</small></article>
          <article><span>Listed</span><b>{inventorySummary.listed.toLocaleString()}</b><small>{Math.round((inventorySummary.listed / inventorySummary.totalCards) * 100)}% of inventory</small></article>
          <article><span>Not listed</span><b>{inventorySummary.unlisted.toLocaleString()}</b><small>Available to review</small></article>
          <article><span>Listed value</span><b>{"$"}{inventorySummary.listedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</b><small>Current asking-price total</small></article>
        </section>

        <section className="inventory-search-panel" id="card-search">
          <div className="inventory-search-heading">
            <div><small>QUICK FIND</small><h2>Where is that card?</h2></div>
            {hasFilters && <button type="button" onClick={clearFilters}>Clear all</button>}
          </div>
          <label className="inventory-command-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); resetLimit(); }}
              placeholder="Search card name, SKU, set, number, or artist…" autoComplete="off" autoFocus />
            {query && <button type="button" onClick={() => { setQuery(""); resetLimit(); }} aria-label="Clear search">×</button>}
          </label>
          <div className="inventory-filter-row">
            <label><span>Storage</span><select value={box} onChange={(event) => { setBox(event.target.value); resetLimit(); }}><option value="all">All boxes</option>{boxes.map((value) => <option key={value.id} value={value.id}>{value.label} · {value.cardCount}</option>)}</select></label>
            <label><span>Game</span><select value={game} onChange={(event) => { setGame(event.target.value); resetLimit(); }}><option value="all">All games</option>{games.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); resetLimit(); }}><option value="all">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
        </section>

        <section className="inventory-result-panel">
          <header>
            <div><h2>{hasFilters ? "Search results" : "Recently cataloged"}</h2><span>{searching ? "Searching…" : hasFilters ? `${totalResults.toLocaleString()} matches` : "Newest inventory first"}</span></div>
            {!hasFilters && <a href="#card-search">Search all {inventorySummary.totalCards.toLocaleString()} cards</a>}
          </header>
          <div className="inventory-list" role="list">
            {filtered.map((record) => (
              <button className="inventory-list-row" key={record.sku} onClick={() => setSelected(record)} role="listitem">
                <span className="inventory-list-image">{record.frontImage ? <img src={record.frontImage} alt="" loading="lazy" /> : <i>No image</i>}</span>
                <span className="inventory-list-primary"><b>{record.name}</b><small>{record.set}{record.number ? ` · ${record.number}` : ""}</small></span>
                <span className="inventory-list-sku"><small>SKU</small><b>{record.sku}</b></span>
                <span className="inventory-list-location"><small>LOCATION</small><b>{record.box}</b></span>
                <span className={`inventory-list-state is-${record.status.toLowerCase()}`}>{record.status}</span>
                <span className="inventory-list-price">{record.price ? `$${record.price.toFixed(2)}` : "—"}</span>
                <span className="inventory-list-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          {!searching && !filtered.length && <div className="inventory-empty"><b>No cards found</b><span>Try a shorter name, SKU, or clear the filters.</span><button type="button" onClick={clearFilters}>Clear filters</button></div>}
          {visible < totalResults && <button className="inventory-more" onClick={() => setVisible((count) => count + 30)}>{searching ? "Loading…" : "Load 30 more"}</button>}
        </section>
      </section>

      {selected && (
        <div className="inventory-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <article className="inventory-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <button className="inventory-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <div className="inventory-drawer-images">
              {[selected.frontImage, selected.backImage].filter(Boolean).map((image, index) => <img key={image} src={image!} alt={`${selected.name} card ${index ? "back" : "front"}`} />)}
            </div>
            <div className="inventory-drawer-copy">
              {(() => {
                const live = liveMarkets[selected.sku];
                const displayMarket = live?.consensusMarket ?? selected.market?.currentPrice ?? null;
                return <>
              <span className="inventory-drawer-location">{selected.box}</span>
              <p>{selected.sku} · {selected.game}</p><h2>{selected.name}</h2><h3>{selected.set}{selected.number ? ` · ${selected.number}` : ""}</h3>
              <dl>
                <div><dt>Condition</dt><dd>{selected.condition}</dd></div><div><dt>Finish</dt><dd>{selected.finish}</dd></div>
                <div><dt>Language</dt><dd>{selected.language}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div>
                <div><dt>Artist</dt><dd>{selected.artist || "—"}</dd></div><div><dt>Rarity</dt><dd>{selected.rarity || "—"}</dd></div>
              </dl>
              <section className="inventory-market-card" aria-label="Market snapshot">
                <header>
                  <div><small>MARKET SNAPSHOT</small><h3>Pricing intelligence</h3></div>
                  <span>{selected.market?.updatedAt ? `Updated ${shortDate(selected.market.updatedAt)}` : "No price refresh yet"}</span>
                </header>
                <div className="inventory-market-metrics">
                  <article>
                    <span>Current market</span>
                    <b>{money(displayMarket)}</b>
                    <small>{live?.matchedSources ? `${live.matchedSources} live source${live.matchedSources === 1 ? "" : "s"}` : selected.market?.currentPriceKind || "No matched market source"}</small>
                  </article>
                  <article>
                    <span>Your asking price</span>
                    <b>{money(selected.price)}</b>
                    <small>{displayMarket && selected.price
                      ? `${selected.price >= displayMarket ? "+" : ""}${(selected.price - displayMarket).toFixed(2)} vs market`
                      : "No comparison available"}</small>
                  </article>
                  <article>
                    <span>eBay comp median</span>
                    <b>{money(selected.market?.activeCompMedian ?? null)}</b>
                    <small>{selected.market?.activeCompCount
                      ? `${selected.market.activeCompCount} exact active comps${selected.market.activeCompLow && selected.market.activeCompHigh ? ` · ${money(selected.market.activeCompLow)}–${money(selected.market.activeCompHigh)}` : ""}`
                      : "No exact active comps"}</small>
                  </article>
                  <article>
                    <span>Last sold here</span>
                    <b>{money(selected.market?.lastSoldPrice ?? null)}</b>
                    <small>{selected.market?.lastSoldAt
                      ? `${shortDate(selected.market.lastSoldAt)}${selected.market.lastSoldQuantity && selected.market.lastSoldQuantity > 1 ? ` · qty ${selected.market.lastSoldQuantity}` : ""}`
                      : "No matching Pocket Archives sale"}</small>
                  </article>
                </div>
                <footer>
                  <span>Active eBay comps are asking prices, not realized sales.</span>
                  {selected.market?.source && <a href={selected.market.source} target="_blank" rel="noreferrer">Open price source ↗</a>}
                </footer>
                <div className="inventory-live-market-sources">
                  <div className="inventory-live-market-heading">
                    <span><b>Live source checks</b><small>{live ? `${live.matchedSources} exact price match${live.matchedSources === 1 ? "" : "es"} · ${shortDate(live.fetchedAt)}` : "Runs when this card opens"}</small></span>
                    <button type="button" onClick={() => void loadLiveMarket(selected.sku, true)} disabled={marketLoadingSku === selected.sku}>{marketLoadingSku === selected.sku ? "Checking…" : "Refresh market"}</button>
                  </div>
                  {marketLoadingSku === selected.sku && !live && <p>Checking TCGplayer-derived catalogs and specialist sources…</p>}
                  {live?.sources.filter((source) => source.status !== "no_match" || source.id === "tcgcsv").map((source) => (
                    <article key={source.id} className={`is-${source.status}`}>
                      <span><b>{source.name}</b><small>{source.detail}{source.variant ? ` · ${source.variant}` : ""}</small></span>
                      <strong>{source.status === "matched" ? money(source.market) : source.status === "unavailable" ? "Offline" : "No match"}</strong>
                      {source.url && <a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.name}`}>↗</a>}
                    </article>
                  ))}
                  {live && <p>{live.warning}</p>}
                </div>
              </section>
              {selected.listingUrl && <a href={selected.listingUrl} target="_blank" rel="noreferrer">Open eBay listing ↗</a>}
                </>;
              })()}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
