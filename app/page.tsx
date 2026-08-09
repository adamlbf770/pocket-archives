"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PokemonArt = {
  id: string;
  title: string;
  dex: number | null;
  generation: number | null;
  category: "generation" | "alternate";
  collection: string;
  src: string;
};

const PAGE_SIZE = 72;
const generationRoman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export default function Home() {
  const [art, setArt] = useState<PokemonArt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dex");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PokemonArt | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/data/pokemon.json").then((response) => response.json()).then(setArt);
    const saved = localStorage.getItem("pocket-archive-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (!selected) return;
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const current = filtered.findIndex((item) => item.id === selected.id);
        const next = (current + direction + filtered.length) % filtered.length;
        setSelected(filtered[next]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = art.filter((item) => {
      const filterMatch = filter === "all" ||
        (filter === "alternate" && item.category === "alternate") ||
        (filter === "favorites" && favorites.has(item.id)) ||
        (filter.startsWith("gen-") && item.generation === Number(filter.slice(4)));
      const searchMatch = !needle || `${item.title} ${item.dex ?? ""} ${item.collection}`.toLowerCase().includes(needle);
      return filterMatch && searchMatch;
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "collection") return a.collection.localeCompare(b.collection) || a.title.localeCompare(b.title);
      return (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title);
    });
  }, [art, query, filter, sort, favorites]);

  const featured = useMemo(() => {
    const names = ["Bulbasaur", "Charizard", "Pikachu", "Gengar", "Eevee"];
    return names.map((name) => art.find((item) => item.title === name && item.category === "generation")).filter(Boolean) as PokemonArt[];
  }, [art]);

  useEffect(() => setVisible(PAGE_SIZE), [query, filter, sort]);

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("pocket-archive-favorites", JSON.stringify([...next]));
      return next;
    });
  }

  const counts = useMemo(() => ({
    generations: art.filter((item) => item.category === "generation").length,
    alternates: art.filter((item) => item.category === "alternate").length,
  }), [art]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pocket Archive home">
          <span className="brand-mark"><i /></span>
          <span>POCKET<br />ARCHIVE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#collection">Collection</a>
          <a href="#about">About</a>
        </nav>
        <button className="favorites-link" onClick={() => { setFilter("favorites"); document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }); }}>
          <span>♥</span> Favorites <b>{favorites.size}</b>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> The complete illustrated index</p>
          <h1>Every era.<br /><em>Every form.</em></h1>
          <p className="hero-intro">A fan-made field guide to 1,858 pieces of official Pokémon character art—from Kanto classics to Paldea and beyond.</p>
          <a className="explore-button" href="#collection">Explore the archive <span>↓</span></a>
        </div>
        <div className="hero-gallery" aria-label="Featured Pokémon artwork">
          {featured.map((item, index) => (
            <button key={item.id} className={`feature-card feature-${index + 1}`} onClick={() => setSelected(item)} aria-label={`View ${item.title}`}>
              <span className="feature-number">{String(item.dex).padStart(4, "0")}</span>
              <img src={item.src} alt={item.title} />
            </button>
          ))}
          {!featured.length && <div className="hero-loader">Cataloguing<br />the archive…</div>}
        </div>
        <div className="hero-stats">
          <span><b>{art.length ? art.length.toLocaleString() : "—"}</b> artworks</span>
          <span><b>9</b> generations</span>
          <span><b>{counts.alternates || "—"}</b> alternates</span>
        </div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Browse the collection</p>
            <h2>Find your favorite.</h2>
          </div>
          <p>Search by name, Pokédex number, generation, or special collection.</p>
        </div>

        <div className="filter-panel">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pokémon, number, or collection…" aria-label="Search archive" />
            <kbd>/</kbd>
          </label>
          <div className="filter-row" aria-label="Filter by generation">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            {Array.from({ length: 9 }, (_, index) => index + 1).map((gen) => (
              <button key={gen} className={filter === `gen-${gen}` ? "active" : ""} onClick={() => setFilter(`gen-${gen}`)}>Gen {generationRoman[gen]}</button>
            ))}
            <button className={filter === "alternate" ? "active" : ""} onClick={() => setFilter("alternate")}>Alternate art</button>
          </div>
        </div>

        <div className="results-bar">
          <p><b>{filtered.length.toLocaleString()}</b> {filtered.length === 1 ? "artwork" : "artworks"}</p>
          <label>Sort
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="dex">Pokédex number</option>
              <option value="name">Name A–Z</option>
              <option value="collection">Collection</option>
            </select>
          </label>
        </div>

        {art.length === 0 ? (
          <div className="loading-grid">Opening the archive…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span>?</span><h3>No matches found</h3><p>Try another name, number, or generation.</p><button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button></div>
        ) : (
          <div className="art-grid">
            {filtered.slice(0, visible).map((item) => (
              <article className="art-card" key={item.id}>
                <button className="image-button" onClick={() => setSelected(item)} aria-label={`View ${item.title}`}>
                  <span className="dex-number">{item.dex ? `#${String(item.dex).padStart(4, "0")}` : "ALT"}</span>
                  <img src={item.src} alt={item.title} loading="lazy" />
                  <span className="view-prompt">View artwork ↗</span>
                </button>
                <div className="card-info">
                  <div><h3>{item.title}</h3><p>{item.collection}</p></div>
                  <button className={`heart ${favorites.has(item.id) ? "saved" : ""}`} onClick={() => toggleFavorite(item.id)} aria-label={`${favorites.has(item.id) ? "Remove" : "Add"} ${item.title} ${favorites.has(item.id) ? "from" : "to"} favorites`}>♥</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {visible < filtered.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, filtered.length - visible)}</span></button>}
      </section>

      <section className="about" id="about">
        <p className="eyebrow"><span /> About the archive</p>
        <div className="about-grid">
          <h2>A visual history,<br />one creature at a time.</h2>
          <div><p>Pocket Archive organizes this complete character-art collection into one fast, searchable gallery. It includes the core Pokédex across nine generations, regional forms, Mega Evolutions, Gigantamax forms, shiny artwork, and artwork from across the games.</p><p className="fine-print">A personal, non-commercial fan archive. Pokémon and all related characters are trademarks of Nintendo, Game Freak, and Creatures Inc.</p></div>
        </div>
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVE</span></div><p>Gotta archive ’em all.</p><a href="#top">Back to top ↑</a></footer>

      {selected && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`${selected.title} artwork`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close artwork">×</button>
          <div className="modal-art"><span className="modal-index">{selected.dex ? `#${String(selected.dex).padStart(4, "0")}` : "ALTERNATE ART"}</span><img src={selected.src} alt={selected.title} /></div>
          <div className="modal-details"><p className="eyebrow"><span /> {selected.collection}</p><h2>{selected.title}</h2><p>{selected.generation ? `Generation ${generationRoman[selected.generation]} artwork` : "Special collection artwork"}</p><div className="modal-actions"><button onClick={() => toggleFavorite(selected.id)}>{favorites.has(selected.id) ? "♥ Saved" : "♡ Save favorite"}</button><a href={selected.src} download>Download ↓</a></div><p className="key-hint">Use ← → to browse · Esc to close</p></div>
        </div>
      )}
    </main>
  );
}
