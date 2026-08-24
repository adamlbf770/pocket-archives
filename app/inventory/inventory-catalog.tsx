"use client";

import { useMemo, useState } from "react";

type Box = {
  id: string;
  label: string;
  description: string;
  cardCount: number;
};

type Record = {
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
  boxId: string;
  box: string;
  status: string;
  price: number | null;
  listingId: string | null;
  listingUrl: string | null;
  frontImage: string | null;
  backImage: string | null;
};

export default function InventoryCatalog({
  boxes,
  records,
  updatedAt,
  ownerName,
}: {
  boxes: readonly Box[];
  records: readonly Record[];
  updatedAt: string;
  ownerName: string;
}) {
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [box, setBox] = useState("all");
  const [game, setGame] = useState("all");
  const [status, setStatus] = useState("all");
  const [visible, setVisible] = useState(60);
  const [selected, setSelected] = useState<Record | null>(null);

  const games = useMemo(() => [...new Set(records.map((record) => record.game))].sort(), [records]);
  const statuses = useMemo(() => [...new Set(records.map((record) => record.status))].sort(), [records]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const setNeedle = setFilter.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery = !needle || [record.name, record.sku, record.number]
        .some((value) => value.toLowerCase().includes(needle));
      const matchesSet = !setNeedle || record.set.toLowerCase().includes(setNeedle);
      return matchesQuery && matchesSet && (box === "all" || record.boxId === box) &&
        (game === "all" || record.game === game) && (status === "all" || record.status === status);
    });
  }, [records, query, setFilter, box, game, status]);

  function resetLimit() {
    setVisible(60);
  }

  return (
    <main className="inventory-app">
      <header className="inventory-header">
        <div className="inventory-brand">
          <span className="inventory-mark" aria-hidden="true"><i /></span>
          <div><b>POCKET ARCHIVES</b><small>PRIVATE INVENTORY</small></div>
        </div>
        <div className="inventory-owner"><span>Signed in as</span><b>{ownerName}</b></div>
      </header>

      <section className="inventory-hero">
        <div>
          <p>COLLECTION CONTROL · {new Date(updatedAt + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}</p>
          <h1>Find any card.<br />Know its box.</h1>
        </div>
        <div className="inventory-total"><strong>{records.length.toLocaleString()}</strong><span>cards indexed</span></div>
      </section>

      <section className="inventory-boxes" aria-label="Storage boxes">
        {boxes.map((item) => (
          <button key={item.id} className={box === item.id ? "is-active" : ""} onClick={() => { setBox(box === item.id ? "all" : item.id); resetLimit(); }}>
            <span>{item.label}</span><strong>{item.cardCount}</strong><small>{item.description}</small>
          </button>
        ))}
      </section>

      <section className="inventory-controls">
        <label className="inventory-search">
          <span>CARD NAME, SKU, OR NUMBER</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); resetLimit(); }} placeholder="Pikachu, PA-0182, 58/102…" autoComplete="off" />
        </label>
        <label><span>SET</span><input value={setFilter} onChange={(event) => { setSetFilter(event.target.value); resetLimit(); }} placeholder="Base Set, Jungle…" autoComplete="off" /></label>
        <label><span>GAME</span><select value={game} onChange={(event) => { setGame(event.target.value); resetLimit(); }}><option value="all">All games</option>{games.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>STATUS</span><select value={status} onChange={(event) => { setStatus(event.target.value); resetLimit(); }}><option value="all">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      </section>

      <div className="inventory-results-heading"><b>{filtered.length.toLocaleString()} MATCHES</b><span>Card search and set search are separated for accurate matches</span></div>

      <section className="inventory-grid">
        {filtered.slice(0, visible).map((record) => (
          <button className="inventory-card" key={record.sku} onClick={() => setSelected(record)}>
            <div className="inventory-card-image">
              {record.frontImage ? <img src={record.frontImage} alt={`${record.name} card front`} loading="lazy" /> : <span>SCAN<br />PENDING</span>}
              <i>{record.box}</i>
            </div>
            <div className="inventory-card-copy">
              <small>{record.sku} · {record.game}</small>
              <h2>{record.name}</h2>
              <p>{record.set}{record.number ? ` · ${record.number}` : ""}</p>
              <footer><span>{record.condition}</span><b>{record.price ? `$${record.price.toFixed(2)}` : record.status}</b></footer>
            </div>
          </button>
        ))}
      </section>

      {!filtered.length && <div className="inventory-empty"><b>No cards found.</b><span>Try a broader name, set, SKU, or clear a filter.</span></div>}
      {visible < filtered.length && <button className="inventory-more" onClick={() => setVisible((count) => count + 60)}>SHOW 60 MORE</button>}

      {selected && (
        <div className="inventory-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <article className="inventory-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="inventory-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <div className="inventory-modal-images">
              {[selected.frontImage, selected.backImage].filter(Boolean).map((image, index) => <img key={image} src={image!} alt={`${selected.name} card ${index ? "back" : "front"}`} />)}
            </div>
            <div className="inventory-modal-copy">
              <p>{selected.sku} · {selected.box}</p><h2>{selected.name}</h2>
              <dl>
                <div><dt>Set</dt><dd>{selected.set}</dd></div><div><dt>Number</dt><dd>{selected.number || "—"}</dd></div>
                <div><dt>Game</dt><dd>{selected.game}</dd></div><div><dt>Year</dt><dd>{selected.year || "—"}</dd></div>
                <div><dt>Condition</dt><dd>{selected.condition}</dd></div><div><dt>Finish</dt><dd>{selected.finish}</dd></div>
                <div><dt>Language</dt><dd>{selected.language}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div>
              </dl>
              {selected.listingUrl && <a href={selected.listingUrl} target="_blank" rel="noreferrer">OPEN EBAY LISTING ↗</a>}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
