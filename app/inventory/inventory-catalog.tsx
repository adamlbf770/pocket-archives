"use client";

import { useMemo, useState } from "react";

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

const skuNumber = (sku: string) => Number(sku.replace(/\D/g, "")) || 0;
const money = (value: number | null) => value === null ? "—" : `$${value.toFixed(2)}`;
const shortDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "—";

function searchRank(record: Record, needle: string) {
  if (!needle) return 0;
  const name = record.name.toLowerCase();
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 60;
  if (record.sku.toLowerCase() === needle) return 55;
  if (record.sku.toLowerCase().includes(needle)) return 45;
  if (record.number.toLowerCase() === needle) return 40;
  if (record.artist.toLowerCase().includes(needle)) return 30;
  if (record.set.toLowerCase().includes(needle)) return 20;
  return -1;
}

export default function InventoryCatalog({ boxes, records, ownerName }: {
  boxes: readonly Box[];
  records: readonly Record[];
  ownerName: string;
}) {
  const [query, setQuery] = useState("");
  const [box, setBox] = useState("all");
  const [game, setGame] = useState("all");
  const [status, setStatus] = useState("all");
  const [visible, setVisible] = useState(30);
  const [selected, setSelected] = useState<Record | null>(null);

  const games = useMemo(() => [...new Set(records.map((record) => record.game))].sort(), [records]);
  const statuses = useMemo(() => [...new Set(records.map((record) => record.status))].sort(), [records]);
  const listed = useMemo(() => records.filter((record) => record.status === "Listed"), [records]);
  const unlisted = records.length - listed.length;
  const listedValue = useMemo(() => listed.reduce((sum, record) => sum + (record.price ?? 0), 0), [listed]);
  const hasFilters = Boolean(query.trim()) || box !== "all" || game !== "all" || status !== "all";

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .map((record) => ({ record, rank: searchRank(record, needle) }))
      .filter(({ record, rank }) => rank >= 0 && (box === "all" || record.boxId === box) &&
        (game === "all" || record.game === game) && (status === "all" || record.status === status))
      .sort((a, b) => needle ? b.rank - a.rank || skuNumber(b.record.sku) - skuNumber(a.record.sku) : skuNumber(b.record.sku) - skuNumber(a.record.sku))
      .map(({ record }) => record);
  }, [records, query, box, game, status]);

  function resetLimit() { setVisible(30); }
  function clearFilters() { setQuery(""); setBox("all"); setGame("all"); setStatus("all"); resetLimit(); }

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
          <span className="inventory-live-status"><i /> Data current</span>
        </header>

        <section className="inventory-stat-grid" aria-label="Inventory summary">
          <article><span>Total cards</span><b>{records.length.toLocaleString()}</b><small>Across {boxes.length} storage locations</small></article>
          <article><span>Listed</span><b>{listed.length.toLocaleString()}</b><small>{Math.round((listed.length / records.length) * 100)}% of inventory</small></article>
          <article><span>Not listed</span><b>{unlisted.toLocaleString()}</b><small>Available to review</small></article>
          <article><span>Listed value</span><b>{"$"}{listedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</b><small>Current asking-price total</small></article>
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
            <div><h2>{hasFilters ? "Search results" : "Recently cataloged"}</h2><span>{hasFilters ? `${filtered.length.toLocaleString()} matches` : "Newest inventory first"}</span></div>
            {!hasFilters && <a href="#card-search">Search all {records.length.toLocaleString()} cards</a>}
          </header>
          <div className="inventory-list" role="list">
            {filtered.slice(0, visible).map((record) => (
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
          {!filtered.length && <div className="inventory-empty"><b>No cards found</b><span>Try a shorter name, SKU, or clear the filters.</span><button type="button" onClick={clearFilters}>Clear filters</button></div>}
          {visible < filtered.length && <button className="inventory-more" onClick={() => setVisible((count) => count + 30)}>Load 30 more</button>}
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
                    <b>{money(selected.market?.currentPrice ?? null)}</b>
                    <small>{selected.market?.currentPriceKind || "No matched market source"}</small>
                  </article>
                  <article>
                    <span>Your asking price</span>
                    <b>{money(selected.price)}</b>
                    <small>{selected.market?.currentPrice && selected.price
                      ? `${selected.price >= selected.market.currentPrice ? "+" : ""}${(selected.price - selected.market.currentPrice).toFixed(2)} vs market`
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
              </section>
              {selected.listingUrl && <a href={selected.listingUrl} target="_blank" rel="noreferrer">Open eBay listing ↗</a>}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
