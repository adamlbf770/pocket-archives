"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ARCHIVE_ORIGIN, SHOP_ORIGIN, demoCuratedCollections, demoInventory, formatPrice, inventoryCollectionOptions, recordStateLabel, shopObjectUrl, statusLabel, type InventoryItem } from "./catalog";

type QuickView = "all" | "available" | "collections" | "archive";

function ShopHeader() {
  return <header className="site-header shop-site-header"><Link className="brand" href={SHOP_ORIGIN}><span className="brand-mark"><i /></span><span>POCKET ARCHIVES<br />SHOP</span></Link><nav aria-label="Ecosystem navigation"><Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link><Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link><Link href={`${ARCHIVE_ORIGIN}/#pokedex`}>Pokédex ↗</Link><Link className="active" href={SHOP_ORIGIN}>Shop</Link></nav></header>;
}

function DemoNotice() {
  return <p className="shop-demo-notice"><span aria-hidden="true" /> Demo inventory — replace before launch</p>;
}

function ObjectVisual({ item, imageIndex = 0, detail = false }: { item: InventoryItem; imageIndex?: number; detail?: boolean }) {
  const image = item.images[imageIndex];
  return <span className={detail ? "artifact-primary" : "artifact-image"}>{detail && <small>{image.caption}</small>}<img src={image.src} alt={image.caption} /></span>;
}

function ArtifactCard({ item }: { item: InventoryItem }) {
  return <Link className={`artifact-card status-${item.availabilityStatus}`} href={shopObjectUrl(item.slug)}><ObjectVisual item={item} /><span className="artifact-card-copy"><small>{item.accessionNumber} · {item.year || "Undated"} · {item.country}</small><strong>{item.title}</strong><em>{item.subtitle}</em><span><b>{recordStateLabel(item.recordState)}</b>{item.price !== null && item.availabilityStatus !== "not-for-sale" && <i>{formatPrice(item.price, item.currency)}</i>}</span></span></Link>;
}

export function ShopLanding() {
  const [query, setQuery] = useState("");
  const [quickView, setQuickView] = useState<QuickView>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [collection, setCollection] = useState("All objects");
  const [artist, setArtist] = useState("All artists");
  const [era, setEra] = useState("All eras");
  const [country, setCountry] = useState("All countries");
  const [language, setLanguage] = useState("All languages");
  const [condition, setCondition] = useState("All conditions");
  const [availability, setAvailability] = useState("All records");

  const results = useMemo(() => demoInventory.filter((item) => {
    const needle = query.trim().toLowerCase();
    const searchable = `${item.accessionNumber} ${item.title} ${item.subtitle} ${item.description} ${item.objectType} ${item.category} ${item.tags.join(" ")} ${item.pokemonNames.join(" ")} ${item.artist || ""} ${item.year || ""} ${item.country} ${item.language} ${item.series || ""} ${item.condition}`.toLowerCase();
    const quickMatch = quickView === "all" ||
      (quickView === "available" && item.availabilityStatus === "available") ||
      (quickView === "collections" && (item.category.toLowerCase().includes("collection") || item.tags.some((tag) => tag.toLowerCase().includes("collection")))) ||
      (quickView === "archive" && item.fromArchive);
    return (!needle || searchable.includes(needle)) && quickMatch &&
      (collection === "All objects" || item.category === collection || item.tags.includes(collection)) &&
      (artist === "All artists" || item.artist === artist) &&
      (era === "All eras" || item.era === era) &&
      (country === "All countries" || item.country === country) &&
      (language === "All languages" || item.language === language) &&
      (condition === "All conditions" || item.condition === condition) &&
      (availability === "All records" || item.availabilityStatus === availability);
  }), [query, quickView, collection, artist, era, country, language, condition, availability]);

  const values = (key: "artist" | "era" | "country" | "language" | "condition") => [...new Set(demoInventory.map((item) => item[key]).filter(Boolean))] as string[];
  const usedCollections = inventoryCollectionOptions.filter((option) => demoInventory.some((item) => item.category === option || item.tags.includes(option)));
  const available = demoInventory.filter((item) => item.availabilityStatus === "available").length;
  const archived = demoInventory.filter((item) => item.availabilityStatus === "sold").length;
  const years = demoInventory.map((item) => item.year).filter((year): year is number => year !== null);
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "Undated";
  const resetFilters = () => { setQuery(""); setQuickView("all"); setCollection("All objects"); setArtist("All artists"); setEra("All eras"); setCountry("All countries"); setLanguage("All languages"); setCondition("All conditions"); setAvailability("All records"); };

  return <main className="shop-shell"><ShopHeader /><section className="shop-hero"><div><p className="eyebrow"><span /> Pocket Archives / Shop</p><h1>Objects worth<br />keeping<span>.</span></h1></div><p>Selected cards, printed matter, and artifacts from Pokémon’s visual history.</p></section><section className="shop-content"><div className="shop-utility-line"><DemoNotice /><div className="shop-stat-strip" aria-label="Shop inventory summary"><span><b>{available}</b> Available</span><span><b>{archived}</b> Archived</span><span><b>{demoCuratedCollections.length}</b> Collections</span><span><b>{yearRange}</b></span></div></div><div className="shop-section-heading"><h2>Objects</h2><span>{results.length} shown</span></div><div className="shop-filters"><div className="shop-filter-bar"><div className="shop-quick-filters" aria-label="Catalog views">{([['all', 'All'], ['available', 'Available'], ['collections', 'Collections'], ['archive', 'From the Archive']] as [QuickView, string][]).map(([value, label]) => <button key={value} className={quickView === value ? "active" : ""} onClick={() => setQuickView(value)}>{label}</button>)}</div><button className={`advanced-filter-toggle ${advancedOpen ? "active" : ""}`} onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen}>Filter <span>{advancedOpen ? "−" : "+"}</span></button></div><label className="shop-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects or accession numbers" aria-label="Search shop objects" /></label>{advancedOpen && <div className="shop-filter-grid"><label>Collection<select value={collection} onChange={(event) => setCollection(event.target.value)}><option>All objects</option>{usedCollections.map((option) => <option key={option}>{option}</option>)}</select></label><label>Artist<select value={artist} onChange={(event) => setArtist(event.target.value)}><option>All artists</option>{values("artist").map((option) => <option key={option}>{option}</option>)}</select></label><label>Era<select value={era} onChange={(event) => setEra(event.target.value)}><option>All eras</option>{values("era").map((option) => <option key={option}>{option}</option>)}</select></label><label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>All countries</option>{values("country").map((option) => <option key={option}>{option}</option>)}</select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option>{values("language").map((option) => <option key={option}>{option}</option>)}</select></label><label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option>All conditions</option>{values("condition").map((option) => <option key={option}>{option}</option>)}</select></label><label>State<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All records</option><option value="available">Available</option><option value="reserved">Reserved</option><option value="not-for-sale">Pocket Archives Collection</option><option value="sold">Sold — Archived</option></select></label><button className="filter-reset" onClick={resetFilters}>Clear all</button></div>}</div>{results.length ? <div className="artifact-grid">{results.map((item) => <ArtifactCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span>◇</span><h3>No objects found</h3><p>Try a broader search or clear the filters.</p><button onClick={resetFilters}>Clear filters</button></div>}<section className="curated-collection-section"><div className="shop-section-heading"><h2>Collections</h2><span>Curated groupings</span></div><div className="curated-collection-grid">{demoCuratedCollections.map((group, index) => <article key={group.id}><small>Collection {String(index + 1).padStart(2, "0")}</small><h3>{group.title}</h3><p>{group.description}</p><span>{group.saleMode === "group" ? "Offered as one set" : group.saleMode === "individual" ? "Listed individually" : "Editorial collection"}</span></article>)}</div></section></section><footer className="shop-footer"><span>© Pocket Archives</span><Link href={`${ARCHIVE_ORIGIN}/#archive`}>Visit the Archive ↗</Link></footer></main>;
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
  const [imageIndex, setImageIndex] = useState(0);
  const canAcquire = item.availabilityStatus === "available" && item.quantity > 0;
  return <main className="shop-shell"><ShopHeader /><section className="artifact-detail"><div className="artifact-gallery"><ObjectVisual item={item} imageIndex={imageIndex} detail />{item.images.length > 1 && <div className="artifact-thumbnails">{item.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={`${image.src}-${index}`} onClick={() => setImageIndex(index)} aria-label={`Show ${image.view} photograph`}><img src={image.src} alt="" /><span>{image.view}</span></button>)}</div>}</div><article className="artifact-record"><Link className="artifact-back" href={SHOP_ORIGIN}>← All objects</Link><p className="artifact-kicker">{item.accessionNumber} · {item.year || "Undated"} · {item.country}</p><h1>{item.title}</h1><p className="artifact-subtitle">{item.subtitle}</p>{item.fromArchive && <p className="from-archive-mark">From the Pocket Archives Collection</p>}<p className="artifact-description">{item.description}</p><div className={`artifact-offer state-${item.availabilityStatus}`}><div><span>{recordStateLabel(item.recordState)}</span>{item.price !== null && item.availabilityStatus !== "not-for-sale" && <b>{formatPrice(item.price, item.currency)}</b>}</div>{canAcquire ? <button disabled>Acquisition inquiries opening soon</button> : <strong>{statusLabel(item.availabilityStatus)}</strong>}</div><dl className="artifact-key-facts"><div><dt>Object</dt><dd>{item.objectType}</dd></div><div><dt>Artist</dt><dd>{item.illustrator || item.artist || "Not identified"}</dd></div><div><dt>Date</dt><dd>{item.approximateYear ? `c. ${item.year || "undated"}` : item.year || "Undated"}</dd></div><div><dt>Series</dt><dd>{[item.set, item.series].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Origin</dt><dd>{item.country} · {item.language}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div></dl><section className="archival-note"><h2>Why it matters</h2><p>{item.archivalNote}</p></section><div className="object-record-sections"><details open><summary>Object record <span>+</span></summary><dl><div><dt>Pokémon</dt><dd>{item.pokemonNames.length ? item.pokemonNames.join(" · ") : "Not assigned"}</dd></div><div><dt>Catalog / card number</dt><dd>{item.cardNumber || item.catalogNumber || "Not recorded"}</dd></div><div><dt>Manufacturer / publisher</dt><dd>{[item.manufacturer, item.publisher].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Edition / printing</dt><dd>{[item.edition, item.printing].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Dimensions</dt><dd>{item.dimensions || "Not recorded"}</dd></div><div><dt>Condition notes</dt><dd>{item.conditionNotes}</dd></div></dl></details><details><summary>Provenance <span>+</span></summary><p>{item.provenance}</p><p>{item.sourceMetadata}</p></details><details><summary>Rights &amp; image record <span>+</span></summary><dl><div><dt>Photography / rights</dt><dd>{item.rightsMetadata}</dd></div><div><dt>Image caption</dt><dd>{item.images[imageIndex].caption}</dd></div><div><dt>Image rights status</dt><dd>{item.images[imageIndex].rightsStatus}</dd></div></dl></details></div><div className="artifact-related"><div><span>Related records</span><p>{item.pokemonNames.map((name, index) => <Link key={name} href={`${ARCHIVE_ORIGIN}/#pokemon-${item.pokemonIds[index]}`}>{name} ↗</Link>)}{item.relatedMuseumIds.length > 0 && <Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link>}<Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive research ↗</Link></p></div></div><DemoNotice /></article></section><footer className="shop-footer"><span>© Pocket Archives</span><Link href={SHOP_ORIGIN}>Shop index</Link></footer></main>;
}
