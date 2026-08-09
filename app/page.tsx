"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PokemonArt = {
  id: string; title: string; dex: number | null; generation: number | null;
  category: "generation" | "alternate" | "design"; collection: string; src: string;
};

type PokemonGroup = {
  key: string; dex: number | null; title: string; generation: number;
  representative: PokemonArt; items: PokemonArt[];
};

type PokemonDetails = {
  genus: string; description: string; types: string[]; height: number;
  weight: number; habitat: string | null; legendary: boolean; mythical: boolean;
};

type TcgCard = {
  id: string; name: string; artist?: string; rarity?: string; number: string;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
};

type SetteiGroup = {
  dex: number; name: string; links: { label: string; url: string }[];
};

const referenceResources = [
  { title: "Pokémon settei directory", eyebrow: "402 Pokémon", description: "The complete PS Art Room index of official production model sheets, expressions, poses, movement cycles, and alternate forms.", url: "https://psartroom.weebly.com/setteis.html", keywords: "pokemon settei model sheets sketches poses expressions walk run cycles" },
  { title: "General references", eyebrow: "Poses & motion", description: "Human pose tools, animal movement studies, drawing references, and file-format guidance collected for artists.", url: "https://psartroom.weebly.com/references.html", keywords: "references posemaniacs animals bat cat deer dog dragon horse wolf motion" },
  { title: "Color tools", eyebrow: "Palette lab", description: "A compact collection of palette, contrast, color-scheme, and accessibility tools for building stronger artwork.", url: "https://psartroom.weebly.com/color-tools.html", keywords: "color palette contrast scheme tools" },
  { title: "Digital art tutorials", eyebrow: "Technique", description: "Tutorial links covering digital painting, linework, shading, backgrounds, animation, and workflow.", url: "https://psartroom.weebly.com/digital-art-tutorials.html", keywords: "digital art tutorials painting linework shading background animation" },
  { title: "Traditional art tutorials", eyebrow: "Paper & paint", description: "Traditional drawing and painting lessons gathered by the PS Art Room community.", url: "https://psartroom.weebly.com/art-tutorials.html", keywords: "traditional art tutorials drawing painting paper" },
  { title: "Art programs", eyebrow: "Creative tools", description: "A guide to free and paid programs for illustration, animation, pixel art, and image editing.", url: "https://psartroom.weebly.com/art-programs.html", keywords: "art programs software illustration animation pixel editing" },
];

const PAGE_SIZE = 72;
const generationRoman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const generationRegions = ["Special collections", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar & Hisui", "Paldea"];
const dexGenerationEnds = [151, 251, 386, 493, 649, 721, 809, 905, 1025];

function generationFor(item: PokemonArt) {
  if (item.generation) return item.generation;
  if (!item.dex) return 0;
  const index = dexGenerationEnds.findIndex((end) => item.dex! <= end);
  return index < 0 ? 9 : index + 1;
}

function groupKey(item: PokemonArt) {
  return item.dex ? `dex-${item.dex}` : `special-${item.title.toLowerCase()}`;
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Home() {
  const [art, setArt] = useState<PokemonArt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dex");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PokemonArt | null>(null);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [variantView, setVariantView] = useState<"forms" | "artwork" | "design" | "cards">("forms");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TcgCard | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<"gallery" | "generations" | "designs" | "references" | "favorites">("gallery");
  const [setteiDirectory, setSetteiDirectory] = useState<SetteiGroup[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/data/pokemon.json").then((response) => response.json()).then(setArt);
    fetch("/data/settei-links.json").then((response) => response.json()).then(setSetteiDirectory);
    const saved = localStorage.getItem("pocket-archive-favorite-species");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
    const savedDisplay = localStorage.getItem("pocket-archive-display");
    if (savedDisplay === "list") setDisplayMode("list");
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PokemonArt[]>();
    art.forEach((item) => {
      const key = groupKey(item);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return [...map.entries()].map(([key, items]) => {
      const ordered = [...items].sort((a, b) => {
        const aCore = a.category === "generation" && a.collection.startsWith("Generation") ? 0 : 1;
        const bCore = b.category === "generation" && b.collection.startsWith("Generation") ? 0 : 1;
        return aCore - bCore || a.title.length - b.title.length || a.title.localeCompare(b.title);
      });
      const representative = ordered[0];
      return { key, dex: representative.dex, title: representative.title, generation: generationFor(representative), representative, items: ordered };
    });
  }, [art]);

  const groupMap = useMemo(() => new Map(groups.map((group) => [group.key, group])), [groups]);
  const selectedGroup = selected ? groupMap.get(groupKey(selected)) || null : null;
  const selectedForms = selectedGroup?.items.filter((item) => item.category === "generation") || [];
  const selectedArtwork = selectedGroup?.items.filter((item) => item.category === "alternate") || [];
  const selectedDesign = selectedGroup?.items.filter((item) => item.category === "design") || [];
  const shownVariants = variantView === "forms" ? selectedForms : variantView === "design" ? selectedDesign : selectedArtwork;

  useEffect(() => {
    if (!selectedGroup) return;
    setVariantView(selectedGroup.items.some((item) => item.category === "generation") ? "forms" : "artwork");
    setCards([]);
    setSelectedCard(null);
    setCardsError(false);
  }, [selectedGroup?.key]);

  useEffect(() => {
    if (variantView !== "cards" || !selectedGroup?.dex || cards.length || cardsLoading) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: `nationalPokedexNumbers:${selectedGroup.dex}`,
      pageSize: "250",
      orderBy: "-set.releaseDate,number",
      select: "id,name,artist,rarity,number,set,images",
    });
    setCardsLoading(true);
    setCardsError(false);
    fetch(`https://api.pokemontcg.io/v2/cards?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Card lookup failed"); return response.json(); })
      .then((payload) => { setCards(payload.data || []); setSelectedCard(payload.data?.[0] || null); })
      .catch((error) => { if (error.name !== "AbortError") setCardsError(true); })
      .finally(() => setCardsLoading(false));
    return () => controller.abort();
  }, [variantView, selectedGroup?.dex, cards.length]);

  useEffect(() => {
    if (!selectedGroup?.dex) { setDetails(null); return; }
    const controller = new AbortController();
    setDetailsLoading(true);
    setDetails(null);
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
    ]).then(([pokemon, species]) => {
      const englishDescriptions = species.flavor_text_entries.filter((entry: { language: { name: string } }) => entry.language.name === "en");
      const description = englishDescriptions.at(-1)?.flavor_text.replace(/[\n\f]/g, " ").replace(/\s+/g, " ") || "No Pokédex entry available.";
      const genus = species.genera.find((entry: { language: { name: string } }) => entry.language.name === "en")?.genus || "Pokémon";
      setDetails({ genus, description, types: pokemon.types.map((entry: { type: { name: string } }) => entry.type.name), height: pokemon.height / 10, weight: pokemon.weight / 10, habitat: species.habitat?.name || null, legendary: species.is_legendary, mythical: species.is_mythical });
    }).catch((error) => { if (error.name !== "AbortError") setDetails(null); }).finally(() => setDetailsLoading(false));
    return () => controller.abort();
  }, [selectedGroup?.dex]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = groups.filter((group) => {
      const filterMatch = filter === "all" ||
        (filter === "alternate" && group.items.some((item) => item.category === "alternate")) ||
        (filter.startsWith("gen-") && group.generation === Number(filter.slice(4)));
      const haystack = `${group.title} ${group.dex ?? ""} ${group.items.map((item) => `${item.title} ${item.collection}`).join(" ")}`.toLowerCase();
      return filterMatch && (!needle || haystack.includes(needle));
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "collection") return a.representative.collection.localeCompare(b.representative.collection) || a.title.localeCompare(b.title);
      return (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title);
    });
  }, [groups, query, filter, sort]);

  const generationResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups.filter((group) => !needle || `${group.title} ${group.dex ?? ""} ${group.items.map((item) => `${item.title} ${item.collection}`).join(" ")}`.toLowerCase().includes(needle))
      .sort((a, b) => a.generation - b.generation || (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title));
  }, [groups, query]);

  const favoriteResults = useMemo(() => filteredGroups.filter((group) => favorites.has(group.key)), [filteredGroups, favorites]);
  const designResults = useMemo(() => filteredGroups.filter((group) => group.items.some((item) => item.category === "design")), [filteredGroups]);
  const referenceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return setteiDirectory.filter((group) => !needle || `${group.name} ${group.dex} ${group.links.map((link) => link.label).join(" ")}`.toLowerCase().includes(needle));
  }, [query, setteiDirectory]);
  const resourceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return referenceResources.filter((resource) => !needle || `${resource.title} ${resource.eyebrow} ${resource.description} ${resource.keywords}`.toLowerCase().includes(needle));
  }, [query]);
  const activeGroups = view === "generations" ? generationResults : view === "designs" ? designResults : view === "favorites" ? favoriteResults : filteredGroups;
  const generationGroups = useMemo(() => Array.from({ length: 10 }, (_, generation) => ({ generation, items: generationResults.filter((group) => group.generation === generation) })).filter((group) => group.items.length), [generationResults]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); searchRef.current?.focus(); }
      if (!selected || !selectedGroup) return;
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const current = activeGroups.findIndex((group) => group.key === selectedGroup.key);
        if (current >= 0 && activeGroups.length) setSelected(activeGroups[(current + direction + activeGroups.length) % activeGroups.length].representative);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const featured = useMemo(() => ["Bulbasaur", "Charizard", "Pikachu", "Gengar", "Eevee"].map((name) => art.find((item) => item.title === name && item.category === "generation")).filter(Boolean) as PokemonArt[], [art]);
  const counts = useMemo(() => ({ alternates: art.filter((item) => item.category === "alternate").length }), [art]);
  useEffect(() => setVisible(PAGE_SIZE), [query, filter, sort, view]);

  function toggleFavorite(key: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("pocket-archive-favorite-species", JSON.stringify([...next]));
      return next;
    });
  }

  function changeDisplay(mode: "grid" | "list") {
    setDisplayMode(mode);
    localStorage.setItem("pocket-archive-display", mode);
  }

  function renderGroupCard(group: PokemonGroup) {
    const formCount = group.items.filter((item) => item.category === "generation").length;
    const artworkCount = group.items.filter((item) => item.category === "alternate").length;
    const designCount = group.items.filter((item) => item.category === "design").length;
    return (
      <article className="art-card" key={group.key}>
        <button className="image-button" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="dex-number">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <img src={group.representative.src} alt={group.title} loading="lazy" />
          <span className="view-prompt">Open Pokédex ↗</span>
          {group.items.length > 1 && <span className="forms-count">{formCount > 1 ? `${formCount} forms` : ""}{formCount > 1 && artworkCount ? " · " : ""}{artworkCount ? `${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}` : ""}{designCount ? `${formCount > 1 || artworkCount ? " · " : ""}${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}` : ""}</span>}
        </button>
        <div className="card-info">
          <div><h3>{group.title}</h3><p>{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</p></div>
          <button className={`heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
        </div>
      </article>
    );
  }

  function renderNameRow(group: PokemonGroup) {
    const formCount = group.items.filter((item) => item.category === "generation").length;
    const artworkCount = group.items.filter((item) => item.category === "alternate").length;
    const designCount = group.items.filter((item) => item.category === "design").length;
    return (
      <article className="name-row" key={group.key}>
        <button className="name-row-main" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="name-dex">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <strong>{group.title}</strong>
          <span className="name-region">{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</span>
          <span className="name-counts">{formCount > 1 ? `${formCount} forms` : "Standard form"}{artworkCount ? ` · ${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}` : ""}{designCount ? ` · ${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}` : ""}</span>
          <span className="name-arrow">↗</span>
        </button>
        <button className={`heart name-heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
      </article>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pocket Archive home"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVE</span></a>
        <nav aria-label="Primary navigation"><a href="#collection">Pokédex</a><a href="#about">About</a></nav>
        <button className="favorites-link" onClick={() => { setView("favorites"); setFilter("all"); document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }); }}><span>♥</span> Favorites <b>{favorites.size}</b></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> The complete illustrated Pokédex</p><h1>Every era.<br /><em>Every form.</em></h1><p className="hero-intro">A fan-made field guide to 1,858 pieces of official Pokémon character art—from Kanto classics to Paldea and beyond.</p><a className="explore-button" href="#collection">Open the Pokédex <span>↓</span></a></div>
        <div className="hero-gallery" aria-label="Featured Pokémon artwork">{featured.map((item, index) => <button key={item.id} className={`feature-card feature-${index + 1}`} onClick={() => setSelected(item)} aria-label={`View ${item.title}`}><span className="feature-number">{String(item.dex).padStart(4, "0")}</span><img src={item.src} alt={item.title} /></button>)}{!featured.length && <div className="hero-loader">Cataloguing<br />the archive…</div>}</div>
        <div className="hero-stats"><span><b>{art.length ? art.length.toLocaleString() : "—"}</b> artworks</span><span><b>{groups.filter((group) => group.dex).length || "—"}</b> Pokémon</span><span><b>{counts.alternates || "—"}</b> alternates</span></div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading"><div><p className="eyebrow"><span /> Browse the Pokédex</p><h2>Know your favorite.</h2></div><p>Search a Pokémon once, then explore its Pokédex data, forms, and artwork in one place.</p></div>
        <div className="view-tabs" role="tablist" aria-label="Collection views">
          <button role="tab" aria-selected={view === "gallery"} className={view === "gallery" ? "active" : ""} onClick={() => setView("gallery")}><span>01</span> Pokédex</button>
          <button role="tab" aria-selected={view === "generations"} className={view === "generations" ? "active" : ""} onClick={() => setView("generations")}><span>02</span> By generation</button>
          <button role="tab" aria-selected={view === "designs"} className={view === "designs" ? "active" : ""} onClick={() => { setView("designs"); setFilter("all"); }}><span>03</span> Sketchbook <b>{designResults.length}</b></button>
          <button role="tab" aria-selected={view === "references"} className={view === "references" ? "active" : ""} onClick={() => { setView("references"); setFilter("all"); }}><span>04</span> Reference library <b>{setteiDirectory.reduce((sum, group) => sum + group.links.length, 0)}</b></button>
          <button role="tab" aria-selected={view === "favorites"} className={view === "favorites" ? "active" : ""} onClick={() => { setView("favorites"); setFilter("all"); }}><span>05</span> Favorites <b>{favorites.size}</b></button>
        </div>

        <div className="filter-panel">
          <label className="search-box"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === "references" ? "Search Pokémon, pose, expression, or art resource…" : "Search Pokémon, number, form, or collection…"} aria-label={view === "references" ? "Search reference library" : "Search Pokédex"} /><kbd>/</kbd></label>
          {view === "gallery" ? <div className="filter-row" aria-label="Filter by generation"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>{Array.from({ length: 9 }, (_, index) => index + 1).map((gen) => <button key={gen} className={filter === `gen-${gen}` ? "active" : ""} onClick={() => setFilter(`gen-${gen}`)}>Gen {generationRoman[gen]}</button>)}<button className={filter === "alternate" ? "active" : ""} onClick={() => setFilter("alternate")}>Has alternate art</button></div> : view === "generations" ? <div className="generation-jumps" aria-label="Jump to generation">{generationGroups.filter((group) => group.generation > 0).map((group) => <a key={group.generation} href={`#generation-${group.generation}`}>Gen {generationRoman[group.generation]}</a>)}{generationGroups.some((group) => group.generation === 0) && <a href="#generation-0">Special</a>}</div> : view === "designs" ? <p className="favorites-note">Reference drawings, pose studies, and character-design line art from your supplied archive—kept separate from finished artwork.</p> : view === "references" ? <p className="favorites-note">A credited index of external production references curated by PS Art Room. Links open the original files; Pocket Archive does not rehost them.</p> : <p className="favorites-note">Your saved Pokémon live here on this device.</p>}
        </div>

        <div className="results-bar"><p>{view === "references" ? <><b>{referenceResults.reduce((sum, group) => sum + group.links.length, 0).toLocaleString()}</b> reference sheets · {referenceResults.length.toLocaleString()} Pokémon</> : <><b>{activeGroups.length.toLocaleString()}</b> Pokémon{view === "generations" && " · grouped by debut generation"}{view === "designs" && " · sketches & design"}</>}</p><div className="results-controls">{view === "gallery" && <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="dex">Pokédex number</option><option value="name">Name A–Z</option><option value="collection">Collection</option></select></label>}{view !== "references" && <div className="display-toggle" role="group" aria-label="Display style"><button className={displayMode === "grid" ? "active" : ""} onClick={() => changeDisplay("grid")} aria-pressed={displayMode === "grid"}><span>▦</span> Grid</button><button className={displayMode === "list" ? "active" : ""} onClick={() => changeDisplay("list")} aria-pressed={displayMode === "list"}><span>☰</span> Names</button></div>}</div></div>

        {view === "references" ? <div className="reference-library">
          {!!resourceResults.length && <div className="resource-grid">{resourceResults.map((resource) => <a className="resource-card" href={resource.url} target="_blank" rel="noreferrer" key={resource.title}><span>{resource.eyebrow}</span><h3>{resource.title}</h3><p>{resource.description}</p><b>Visit original resource ↗</b></a>)}</div>}
          {setteiDirectory.length === 0 ? <div className="loading-grid">Indexing the reference room…</div> : referenceResults.length === 0 ? <div className="empty-state"><span>?</span><h3>No references found</h3><p>Try another Pokémon or art topic.</p><button onClick={() => setQuery("")}>Clear search</button></div> : <div className="settei-list">{referenceResults.slice(0, visible).map((group) => <article className="settei-row" key={group.dex}><div className="settei-name"><span>#{String(group.dex).padStart(4, "0")}</span><h3>{group.name}</h3><p>{group.links.length} {group.links.length === 1 ? "sheet" : "sheets"}</p></div><div className="settei-links">{group.links.map((link, index) => <a href={link.url} target="_blank" rel="noreferrer" key={`${link.url}-${index}`}>{link.label === "Model sheet" && index > 0 ? `Model sheet ${index + 1}` : titleCase(link.label)} <span>↗</span></a>)}</div></article>)}</div>}
        </div> : art.length === 0 ? <div className="loading-grid">Opening the archive…</div> : activeGroups.length === 0 ? <div className="empty-state"><span>{view === "favorites" ? "♥" : "?"}</span><h3>{view === "favorites" ? "No favorites yet" : "No matches found"}</h3><p>{view === "favorites" ? "Tap the heart on any Pokémon to build your collection." : "Try another name, number, or generation."}</p>{view !== "favorites" && <button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>}</div> : view === "generations" ? <div className="generation-list">{generationGroups.sort((a, b) => (a.generation || 10) - (b.generation || 10)).map((group) => <section className="generation-section" id={`generation-${group.generation}`} key={group.generation}><div className="generation-heading"><div><span>{group.generation ? `Generation ${generationRoman[group.generation]}` : "Archive extras"}</span><h3>{generationRegions[group.generation]}</h3></div><p>{group.items.length.toLocaleString()} Pokémon</p></div><div className={displayMode === "grid" ? "art-grid" : "name-list"}>{group.items.map(displayMode === "grid" ? renderGroupCard : renderNameRow)}</div></section>)}</div> : <div className={displayMode === "grid" ? "art-grid" : "name-list"}>{(displayMode === "grid" ? activeGroups.slice(0, visible) : activeGroups).map(displayMode === "grid" ? renderGroupCard : renderNameRow)}</div>}
        {view === "references" && visible < referenceResults.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, referenceResults.length - visible)}</span></button>}
        {displayMode === "grid" && view !== "generations" && view !== "references" && visible < activeGroups.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, activeGroups.length - visible)}</span></button>}
      </section>

      <section className="about" id="about"><p className="eyebrow"><span /> About the archive</p><div className="about-grid"><h2>A visual history,<br />one creature at a time.</h2><div><p>Pocket Archive brings each Pokémon’s official art, forms, reference drawings, cards, and Pokédex details together. Sketches and character-design material from your files remain in the Sketchbook; PS Art Room’s external production model sheets now live in a separately credited Reference Library. Species information is supplied by PokéAPI, and the image-only card gallery is supplied by the community Pokémon TCG API.</p><p className="source-links"><a href="https://psartroom.weebly.com/" target="_blank" rel="noreferrer">PS Art Room ↗</a><a href="https://pokeapi.co/docs/v2" target="_blank" rel="noreferrer">Pokédex data ↗</a><a href="https://docs.pokemontcg.io/" target="_blank" rel="noreferrer">Card data ↗</a><a href="https://iwataasks.nintendo.com/interviews/ds/pokemon-black-white/0/1/" target="_blank" rel="noreferrer">Sugimori interview ↗</a></p><p className="fine-print">A personal, non-commercial fan archive. Pokémon and all related characters are trademarks of Nintendo, Game Freak, and Creatures Inc. External reference links remain credited to their original curators and hosts.</p></div></div></section>
      <footer><div className="brand footer-brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVE</span></div><p>Gotta archive ’em all.</p><a href="#top">Back to top ↑</a></footer>

      {selected && selectedGroup && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selectedGroup.title} Pokédex entry`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
        <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close Pokédex entry">×</button>
        <div className={`modal-art ${selectedGroup.dex || selectedGroup.items.length > 1 ? "has-forms" : ""}`}><span className="modal-index">{variantView === "cards" && selectedCard ? `${selectedCard.set.name} · #${selectedCard.number}` : selectedGroup.dex ? `#${String(selectedGroup.dex).padStart(4, "0")}` : "SPECIAL ART"}</span>{variantView === "cards" && selectedCard ? <img className="tcg-card-main" src={selectedCard.images.large} alt={`${selectedCard.name} card from ${selectedCard.set.name}`} /> : <img src={selected.src} alt={selected.title} />}{(selectedGroup.dex || selectedGroup.items.length > 1) && <div className="form-strip" aria-label={`${selectedGroup.title} images`}><div className="variant-tabs" role="tablist" aria-label="Image type"><button role="tab" aria-selected={variantView === "forms"} className={variantView === "forms" ? "active" : ""} disabled={!selectedForms.length} onClick={() => { setVariantView("forms"); if (selectedForms.length) setSelected(selectedForms[0]); }}>Forms <b>{selectedForms.length}</b></button><button role="tab" aria-selected={variantView === "artwork"} className={variantView === "artwork" ? "active" : ""} disabled={!selectedArtwork.length} onClick={() => { setVariantView("artwork"); if (selectedArtwork.length) setSelected(selectedArtwork[0]); }}>Alternate artwork <b>{selectedArtwork.length}</b></button><button role="tab" aria-selected={variantView === "design"} className={variantView === "design" ? "active" : ""} disabled={!selectedDesign.length} onClick={() => { setVariantView("design"); if (selectedDesign.length) setSelected(selectedDesign[0]); }}>Sketches & design <b>{selectedDesign.length}</b></button><button role="tab" aria-selected={variantView === "cards"} className={variantView === "cards" ? "active" : ""} disabled={!selectedGroup.dex} onClick={() => setVariantView("cards")}>Cards <b>{cardsLoading ? "…" : cards.length || ""}</b></button></div>{variantView === "cards" ? cardsLoading ? <p className="card-strip-message">Finding cards…</p> : cardsError ? <p className="card-strip-message">Card gallery unavailable right now.</p> : cards.map((card) => <button key={card.id} className={`variant-thumb card-thumb ${selectedCard?.id === card.id ? "active" : ""}`} onClick={() => setSelectedCard(card)} aria-label={`Show ${card.name}, ${card.set.name} number ${card.number}`}><img src={card.images.small} alt="" loading="lazy" /><span>{card.set.name} · {card.number}</span></button>) : shownVariants.map((item) => <button key={item.id} className={`variant-thumb ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelected(item)} aria-label={`Show ${item.title}, ${item.collection}`}><img src={item.src} alt="" loading="lazy" /><span>{item.title}</span></button>)}</div>}</div>
        <div className="modal-details"><p className="eyebrow"><span /> {selectedGroup.dex ? `Generation ${generationRoman[selectedGroup.generation]} · ${generationRegions[selectedGroup.generation]}` : selected.collection}</p><h2>{selectedGroup.title}</h2>{detailsLoading ? <p className="details-loading">Reading Pokédex data…</p> : details ? <><p className="pokemon-genus">{details.legendary ? "Legendary · " : details.mythical ? "Mythical · " : ""}{details.genus}</p><p className="dex-description">{details.description}</p><div className="type-row">{details.types.map((type) => <span className={`type type-${type}`} key={type}>{titleCase(type)}</span>)}</div><dl className="pokemon-facts"><div><dt>Height</dt><dd>{details.height} m</dd></div><div><dt>Weight</dt><dd>{details.weight} kg</dd></div><div><dt>Habitat</dt><dd>{details.habitat ? titleCase(details.habitat) : "Unknown"}</dd></div><div><dt>Artwork</dt><dd>{selectedGroup.items.length} in archive</dd></div></dl></> : selectedGroup.dex ? <p className="dex-description">Pokédex information is temporarily unavailable.</p> : <p className="dex-description">This unnumbered artwork belongs to the {selected.collection} collection.</p>}
          {variantView === "cards" && selectedCard ? <div className="source-credit card-credit"><span>Trading card</span><b>{selectedCard.set.name} · #{selectedCard.number}</b><p>{selectedCard.rarity || "Rarity not listed"} · Illustrated by {selectedCard.artist || "artist not listed"}</p></div> : <div className="source-credit"><span>Artwork source</span><b>{selected.collection}</b><p>Official Pokémon game artwork from the supplied archive. The individual illustrator is not identified in this file.</p></div>}
          <div className="modal-actions"><button onClick={() => toggleFavorite(selectedGroup.key)}>{favorites.has(selectedGroup.key) ? "♥ In favorites" : "♡ Add to favorites"}</button>{variantView === "cards" && selectedCard ? <a href={selectedCard.images.large} target="_blank" rel="noreferrer">Open card image ↗</a> : <a href={selected.src} download>Download art ↓</a>}</div><p className="key-hint">Use ← → for next Pokémon · Esc to close</p>
        </div>
      </div>}
    </main>
  );
}
