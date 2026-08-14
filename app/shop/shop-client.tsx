"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoCuratedCollections, demoInventory, formatPrice, inventoryCollectionOptions, statusLabel, type InventoryItem } from "./catalog";

const CART_KEY = "pocket-archives-collection-bag";

function useCollectionBag() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) setIds(JSON.parse(saved));
  }, []);

  function persist(next: string[]) {
    const unique = [...new Set(next)].filter((id) => demoInventory.some((item) => item.id === id && item.quantity > 0 && item.status === "available"));
    setIds(unique);
    localStorage.setItem(CART_KEY, JSON.stringify(unique));
  }

  return {
    ids,
    items: ids.map((id) => demoInventory.find((item) => item.id === id)).filter(Boolean) as InventoryItem[],
    add: (id: string) => persist([...ids, id]),
    remove: (id: string) => persist(ids.filter((itemId) => itemId !== id)),
  };
}

function ShopHeader({ bag, remove }: { bag: InventoryItem[]; remove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const total = bag.reduce((sum, item) => sum + item.price, 0);
  return <>
    <header className="site-header shop-site-header">
      <Link className="brand" href="/"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></Link>
      <nav aria-label="Primary navigation"><Link href="/#archive">Archive</Link><Link href="/#museum">Museum</Link><Link href="/#pokedex">Pokédex</Link><Link className="active" href="/shop">Shop</Link></nav>
      <button className="favorites-link shop-bag-button" onClick={() => setOpen(true)}><span>◇</span> Collection Bag <b>{bag.length}</b></button>
    </header>
    {open && <div className="bag-backdrop" role="dialog" aria-modal="true" aria-label="Collection bag" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}><aside className="bag-drawer"><header><div><small>Private selection</small><h2>Collection bag</h2></div><button onClick={() => setOpen(false)} aria-label="Close collection bag">×</button></header>{bag.length ? <><div className="bag-lines">{bag.map((item) => <article key={item.id}><img src={item.images[0]} alt="" /><div><b>{item.title}</b><span>Quantity 1 · {formatPrice(item.price, item.currency)}</span></div><button onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>Remove</button></article>)}</div><div className="bag-total"><span>Selection total</span><b>{formatPrice(total, "USD")}</b></div><button className="checkout-pending" disabled>Checkout connection pending</button><p>Payment processing is intentionally not connected. Your selection is stored only on this device.</p></> : <div className="bag-empty"><span>◇</span><h3>No pieces selected</h3><p>Available objects can be added from an artifact record.</p></div>}</aside></div>}
  </>;
}

function DemoNotice() {
  return <div className="shop-demo-notice"><b>Demonstration inventory</b><p>These records test the shop experience. They do not represent physical objects currently offered for sale.</p></div>;
}

function ArtifactCard({ item }: { item: InventoryItem }) {
  return <Link className={`artifact-card status-${item.status}`} href={`/shop/${item.slug}`}><span className="artifact-image"><small>Demo image</small><img src={item.images[0]} alt={item.title} /></span><span className="artifact-card-copy"><small>{item.year || "Undated"} · {item.category}</small><strong>{item.title}</strong><em>{item.artist || item.set || "Artist not recorded"}</em><span><b>{statusLabel(item.status)}</b>{item.status !== "not-for-sale" && <i>{formatPrice(item.price, item.currency)}</i>}</span></span></Link>;
}

export function ShopLanding() {
  const bag = useCollectionBag();
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All pieces");
  const [artist, setArtist] = useState("All artists");
  const [era, setEra] = useState("All eras");
  const [language, setLanguage] = useState("All languages");
  const [availability, setAvailability] = useState("All records");

  const results = useMemo(() => demoInventory.filter((item) => {
    const needle = query.trim().toLowerCase();
    const searchable = `${item.title} ${item.description} ${item.category} ${item.tags.join(" ")} ${item.pokemonNames.join(" ")} ${item.artist || ""} ${item.year || ""} ${item.language}`.toLowerCase();
    const collectionMatch = collection === "All pieces" || item.category === collection || item.tags.includes(collection);
    const artistMatch = artist === "All artists" || item.artist === artist;
    const eraMatch = era === "All eras" || (era === "1990s" && item.year && item.year >= 1990 && item.year < 2000) || (era === "2000s+" && item.year && item.year >= 2000);
    const languageMatch = language === "All languages" || item.language === language;
    const availabilityMatch = availability === "All records" || item.status === availability;
    return (!needle || searchable.includes(needle)) && collectionMatch && artistMatch && eraMatch && languageMatch && availabilityMatch;
  }), [query, collection, artist, era, language, availability]);

  const artists = [...new Set(demoInventory.map((item) => item.artist).filter(Boolean))] as string[];
  const languages = [...new Set(demoInventory.map((item) => item.language))];

  return <main className="shop-shell">
    <ShopHeader bag={bag.items} remove={bag.remove} />
    <section className="shop-hero"><div><p className="eyebrow"><span /> Collector · Curator · Dealer</p><h1>Pocket Archives<br /><em>Shop</em></h1></div><p>Curated cards, artwork, and artifacts from the history of Pokémon. Objects are documented as archival records first and offered to collectors second.</p></section>
    <section className="shop-content">
      <DemoNotice />
      <div className="shop-section-heading"><div><span>Newly catalogued</span><h2>Available pieces</h2></div><p>A small, changing selection. Sold objects remain in the archive as part of the historical record.</p></div>
      <div className="shop-filters"><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pokémon, artist, object, or year…" aria-label="Search shop inventory" /></label><div className="shop-filter-grid"><label>Collection<select value={collection} onChange={(event) => setCollection(event.target.value)}><option>All pieces</option>{inventoryCollectionOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>Artist<select value={artist} onChange={(event) => setArtist(event.target.value)}><option>All artists</option>{artists.map((option) => <option key={option}>{option}</option>)}</select></label><label>Era<select value={era} onChange={(event) => setEra(event.target.value)}><option>All eras</option><option>1990s</option><option>2000s+</option></select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option>{languages.map((option) => <option key={option}>{option}</option>)}</select></label><label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All records</option><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold — Archived</option><option value="not-for-sale">Archive only</option></select></label></div></div>
      <div className="shop-result-count"><b>{results.length}</b> catalogued {results.length === 1 ? "object" : "objects"}</div>
      {results.length ? <div className="artifact-grid">{results.map((item) => <ArtifactCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span>◇</span><h3>No objects found</h3><p>Try a broader search or reset the collection filters.</p><button onClick={() => { setQuery(""); setCollection("All pieces"); setArtist("All artists"); setEra("All eras"); setLanguage("All languages"); setAvailability("All records"); }}>Reset filters</button></div>}
      <section className="curated-collection-section"><div className="shop-section-heading"><div><span>Editorial groupings</span><h2>Curated collections</h2></div><p>Objects connected by an artist, evolution line, period, or visual idea—sometimes offered together, sometimes documented individually.</p></div><div className="curated-collection-grid">{demoCuratedCollections.map((group, index) => <article key={group.id}><small>Collection {String(index + 1).padStart(2, "0")} · Demo</small><h3>{group.title}</h3><p>{group.description}</p><span>{group.saleMode === "group" ? "Configured as one set" : group.saleMode === "individual" ? "Pieces listed individually" : "Editorial collection"}</span></article>)}</div></section>
    </section>
    <footer><div className="brand footer-brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></div><p>Objects with a history.</p></footer>
  </main>;
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
  const bag = useCollectionBag();
  const [imageIndex, setImageIndex] = useState(0);
  const selected = bag.ids.includes(item.id);
  const canAdd = item.status === "available" && item.quantity > 0;

  return <main className="shop-shell">
    <ShopHeader bag={bag.items} remove={bag.remove} />
    <DemoNotice />
    <section className="artifact-detail">
      <div className="artifact-gallery"><div className="artifact-primary"><span>Demo image · archival stand-in</span><img src={item.images[imageIndex]} alt={`${item.title} view ${imageIndex + 1}`} /></div>{item.images.length > 1 && <div className="artifact-thumbnails">{item.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={image} onClick={() => setImageIndex(index)} aria-label={`Show image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}</div>
      <article className="artifact-record"><Link className="artifact-back" href="/shop">← Shop index</Link><p className="eyebrow"><span /> {item.category} · {item.year || "Undated"}</p><h1>{item.title}</h1>{item.fromArchive && <p className="from-archive-mark">From the Pocket Archives Collection</p>}<p className="artifact-description">{item.description}</p><div className="artifact-offer"><div><span>{statusLabel(item.status)}</span>{item.status !== "not-for-sale" && <b>{formatPrice(item.price, item.currency)}</b>}</div><button disabled={!canAdd || selected} onClick={() => bag.add(item.id)}>{selected ? "Added to Collection" : canAdd ? "Add to Collection" : statusLabel(item.status)}</button></div><dl className="artifact-metadata"><div><dt>Pokémon</dt><dd>{item.pokemonNames.join(" · ")}</dd></div><div><dt>Artist / illustrator</dt><dd>{item.artist || "Not identified"}</dd></div><div><dt>Year</dt><dd>{item.year || "Undated"}</dd></div><div><dt>Set / series</dt><dd>{item.set || "Not recorded"}</dd></div><div><dt>Catalog number</dt><dd>{item.number || "Not recorded"}</dd></div><div><dt>Country / language</dt><dd>{item.country} · {item.language}</dd></div><div><dt>Manufacturer / publisher</dt><dd>{item.manufacturer || "Not recorded"}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div>{item.provenance && <div className="wide"><dt>Provenance</dt><dd>{item.provenance}</dd></div>}</dl><section className="archival-note"><span>Why this piece matters</span><p>{item.archivalNote}</p></section><div className="artifact-related"><div><span>Related Pokémon</span><p>{item.pokemonNames.map((name, index) => <Link key={name} href={`/#pokemon-${item.pokemonIds[index]}`}>{name}</Link>)}</p></div>{item.relatedMuseumIds.length > 0 && <div><span>Related museum content</span><p><Link href="/#museum">The history of Pokémon design</Link></p></div>}<div><span>Related archive material</span><p><Link href="/#pokedex">Artwork and cards in the Pokédex</Link></p></div></div><p className="demo-record-id">Demo record · {item.id} · Replace from the centralized shop catalog before launch</p></article>
    </section>
  </main>;
}
