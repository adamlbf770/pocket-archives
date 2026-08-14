"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ARCHIVE_ORIGIN, SHOP_ORIGIN, demoCuratedCollections, demoInventory, formatPrice, inventoryCollectionOptions, recordStateLabel, shopObjectUrl, statusLabel, type CuratedCollection, type InventoryItem } from "./catalog";

type QuickView = "all" | "cards" | "promos" | "collections";

const collectionVisuals: Record<string, string[]> = {
  "gastly-haunter-gengar": ["/shop/cards/haunter-fossil.png", "/shop/cards/mew-promo.png", "/shop/cards/pikachu-promo.png"],
  "original-starters": ["/shop/cards/bulbasaur-base.png", "/shop/cards/charmander-base.png", "/shop/cards/squirtle-base.png"],
};

const sampleDescriptions: Record<string, string> = {
  "DEMO-001": "A sample listing for a 1999 Base Set Bulbasaur. The final listing will use photos and notes from the actual card.",
  "DEMO-002": "A sample listing for a 1999 Fossil Haunter.",
  "DEMO-003": "A sample listing for the first Pikachu Black Star Promo.",
  "DEMO-004": "A sample listing for the Ancient Mew Black Star Promo.",
  "DEMO-005": "A sample set bringing the three original Base Set starters together.",
};

function categoryLabel(category: InventoryItem["category"]) {
  if (category === "Cards") return "Card";
  if (category === "Promos") return "Promo";
  if (category === "Ephemera" || category === "Printed Matter") return "Print";
  if (category === "Curated Collections") return "Set";
  return category;
}

function filterLabel(label: string) {
  if (label === "All objects") return "Everything";
  if (label === "Ephemera" || label === "Printed Matter") return "Prints";
  if (label === "Curated Collections") return "Sets";
  return label;
}

function ShopHeader() {
  return <header className="site-header shop-site-header"><Link className="brand" href={SHOP_ORIGIN}><span className="brand-mark"><i /></span><span>POCKET ARCHIVES<br />SHOP</span></Link><nav aria-label="Ecosystem navigation"><Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link><Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link><Link href={`${ARCHIVE_ORIGIN}/#pokedex`}>Pokédex ↗</Link><Link className="active" href={SHOP_ORIGIN}>Shop</Link></nav></header>;
}

function DemoNotice() {
  return <p className="shop-demo-notice"><span aria-hidden="true" /> Sample listings — replace before launch</p>;
}

function ObjectVisual({ item, imageIndex = 0, detail = false }: { item: InventoryItem; imageIndex?: number; detail?: boolean }) {
  const image = item.images[imageIndex];
  if (!detail && item.images.length > 1) return <span className="artifact-image artifact-image-stack">{item.images.slice(0, 3).map((card) => <img key={card.src} src={card.src} alt="" />)}</span>;
  return <span className={detail ? "artifact-primary" : "artifact-image"}>{detail && <small>{image.caption}</small>}<img src={image.src} alt={image.caption} /></span>;
}

function ArtifactCard({ item }: { item: InventoryItem }) {
  const showPrice = item.price !== null && item.availabilityStatus === "available";
  return <Link className="artifact-card" href={shopObjectUrl(item.slug)}><ObjectVisual item={item} /><span className="artifact-card-copy"><strong>{item.title}</strong><small>{item.year || "Undated"} {categoryLabel(item.category)} · {item.country}</small><span>{showPrice && <b>{formatPrice(item.price, item.currency)}</b>}{item.fromArchive && <em>From the Archive</em>}</span></span></Link>;
}

function CollectionFeature({ group, onExplore }: { group: CuratedCollection; onExplore: () => void }) {
  const visuals = collectionVisuals[group.slug] || [];
  return <article className="collection-feature"><div className="collection-feature-visual" aria-hidden="true">{visuals.map((src) => <span key={src}><img src={src} alt="" /></span>)}</div><div className="collection-feature-copy"><small>Collection</small><h2>{group.title}</h2><p>{group.description.replace("Objects tracing", "A look at")}</p><span>{group.pokemonIds.length} Pokémon</span><button onClick={onExplore}>See the collection <i>→</i></button></div></article>;
}

export function ShopLanding() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickView, setQuickView] = useState<QuickView>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [collectionFocus, setCollectionFocus] = useState<string | null>(null);
  const [collection, setCollection] = useState("All objects");
  const [artist, setArtist] = useState("All artists");
  const [era, setEra] = useState("All eras");
  const [country, setCountry] = useState("All countries");
  const [language, setLanguage] = useState("All languages");
  const [condition, setCondition] = useState("All conditions");
  const [availability, setAvailability] = useState("Everything");

  const results = useMemo(() => demoInventory.filter((item) => {
    const needle = query.trim().toLowerCase();
    const searchable = `${item.accessionNumber} ${item.title} ${item.subtitle} ${item.description} ${item.objectType} ${item.category} ${item.tags.join(" ")} ${item.pokemonNames.join(" ")} ${item.artist || ""} ${item.year || ""} ${item.country} ${item.language} ${item.series || ""} ${item.condition}`.toLowerCase();
    const cardCategories = ["Cards", "Carddass", "Promos"];
    const promoCategories = ["Promos"];
    const quickMatch = quickView === "all" ||
      (quickView === "cards" && cardCategories.includes(item.category)) ||
      (quickView === "promos" && promoCategories.includes(item.category)) ||
      (quickView === "collections" && item.category === "Curated Collections");
    return (!needle || searchable.includes(needle)) && quickMatch &&
      (!collectionFocus || item.relatedCollectionIds.includes(collectionFocus)) &&
      (collection === "All objects" || item.category === collection || item.tags.includes(collection)) &&
      (artist === "All artists" || item.artist === artist) &&
      (era === "All eras" || item.era === era) &&
      (country === "All countries" || item.country === country) &&
      (language === "All languages" || item.language === language) &&
      (condition === "All conditions" || item.condition === condition) &&
      (availability === "Everything" || item.availabilityStatus === availability);
  }), [query, quickView, collectionFocus, collection, artist, era, country, language, condition, availability]);

  const values = (key: "artist" | "era" | "country" | "language" | "condition") => [...new Set(demoInventory.map((item) => item[key]).filter(Boolean))] as string[];
  const usedCollections = inventoryCollectionOptions.filter((option) => demoInventory.some((item) => item.category === option || item.tags.includes(option)));
  const resetFilters = () => { setQuery(""); setQuickView("all"); setCollectionFocus(null); setCollection("All objects"); setArtist("All artists"); setEra("All eras"); setCountry("All countries"); setLanguage("All languages"); setCondition("All conditions"); setAvailability("Everything"); };
  const chooseView = (view: QuickView) => { setQuickView(view); setCollectionFocus(null); };
  const exploreCollection = (slug: string) => { setCollectionFocus(slug); setQuickView("all"); document.getElementById("shop-grid")?.scrollIntoView({ behavior: "smooth" }); };
  const featured = results.slice(0, 3);
  const more = results.slice(3);

  return <main className="shop-shell"><ShopHeader /><section className="shop-hero"><p className="eyebrow"><span /> Pocket Archives / Shop</p><h1>Worth keeping<span>.</span></h1><p>Vintage Pokémon cards, promos, and sets.</p></section><section className="shop-content"><div className="shop-browse-tools"><div className="shop-quick-filters" aria-label="Shop categories">{([['all', 'All'], ['cards', 'Cards'], ['promos', 'Promos'], ['collections', 'Collections']] as [QuickView, string][]).map(([value, label]) => <button key={value} className={quickView === value && !collectionFocus ? "active" : ""} onClick={() => chooseView(value)}>{label}</button>)}</div><div className="shop-tool-buttons"><button className={searchOpen ? "active" : ""} onClick={() => setSearchOpen((open) => !open)} aria-label="Search shop" aria-expanded={searchOpen}>⌕</button><button className={advancedOpen ? "active" : ""} onClick={() => setAdvancedOpen((open) => !open)} aria-label="More filters" aria-expanded={advancedOpen}>≡</button></div></div>{searchOpen && <label className="shop-search"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the shop" aria-label="Search the shop" /><button onClick={() => { setQuery(""); setSearchOpen(false); }} aria-label="Close search">×</button></label>}{advancedOpen && <div className="shop-filter-grid"><label>Category<select value={collection} onChange={(event) => setCollection(event.target.value)}><option value="All objects">Everything</option>{usedCollections.map((option) => <option key={option} value={option}>{filterLabel(option)}</option>)}</select></label><label>Artist<select value={artist} onChange={(event) => setArtist(event.target.value)}><option>All artists</option>{values("artist").map((option) => <option key={option}>{option}</option>)}</select></label><label>Era<select value={era} onChange={(event) => setEra(event.target.value)}><option>All eras</option>{values("era").map((option) => <option key={option}>{option}</option>)}</select></label><label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>All countries</option>{values("country").map((option) => <option key={option}>{option}</option>)}</select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option>{values("language").map((option) => <option key={option}>{option}</option>)}</select></label><label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option>All conditions</option>{values("condition").map((option) => <option key={option}>{option}</option>)}</select></label><label>Status<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>Everything</option><option value="available">Available</option><option value="reserved">Reserved</option><option value="not-for-sale">Not for sale</option><option value="sold">Sold</option></select></label><button className="filter-reset" onClick={resetFilters}>Clear all</button></div>}{collectionFocus && <button className="active-collection-note" onClick={() => setCollectionFocus(null)}>Showing collection <span>×</span></button>}<div id="shop-grid">{results.length ? <><div className="artifact-grid artifact-grid-featured">{featured.map((item) => <ArtifactCard key={item.id} item={item} />)}</div>{demoCuratedCollections[0] && <CollectionFeature group={demoCuratedCollections[0]} onExplore={() => exploreCollection(demoCuratedCollections[0].slug)} />}{more.length > 0 && <div className="artifact-grid artifact-grid-more">{more.map((item) => <ArtifactCard key={item.id} item={item} />)}</div>}{demoCuratedCollections[1] && <CollectionFeature group={demoCuratedCollections[1]} onExplore={() => exploreCollection(demoCuratedCollections[1].slug)} />}</> : <div className="empty-state"><span>◇</span><h3>Nothing found</h3><p>Try another search or clear the filters.</p><button onClick={resetFilters}>Clear filters</button></div>}</div></section><footer className="shop-footer"><DemoNotice /><Link href={`${ARCHIVE_ORIGIN}/#archive`}>Visit the Archive ↗</Link></footer></main>;
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
  const [imageIndex, setImageIndex] = useState(0);
  const canAcquire = item.availabilityStatus === "available" && item.quantity > 0;
  const description = item.demo ? sampleDescriptions[item.id] : item.description;
  const provenance = item.demo ? "Sample listing; no physical item is represented." : item.provenance;
  const source = item.demo ? "Waiting for photos from the live inventory." : item.sourceMetadata;
  return <main className="shop-shell"><ShopHeader /><section className="artifact-detail"><div className="artifact-gallery"><ObjectVisual item={item} imageIndex={imageIndex} detail />{item.images.length > 1 && <div className="artifact-thumbnails">{item.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={`${image.src}-${index}`} onClick={() => setImageIndex(index)} aria-label={`Show ${image.view} photograph`}><img src={image.src} alt="" /><span>{image.view}</span></button>)}</div>}</div><article className="artifact-record"><Link className="artifact-back" href={SHOP_ORIGIN}>← Back to shop</Link><p className="artifact-kicker">{item.accessionNumber} · {item.year || "Undated"} · {item.country}</p><h1>{item.title}</h1><p className="artifact-subtitle">{item.subtitle.replace("demonstration record", "sample listing").replace("archived demo", "sample listing").replace("collection demo", "sample listing")}</p>{item.fromArchive && <p className="from-archive-mark">From the Pocket Archives Collection</p>}<p className="artifact-description">{description}</p><div className={`artifact-offer state-${item.availabilityStatus}`}><div><span>{recordStateLabel(item.recordState)}</span>{item.price !== null && item.availabilityStatus !== "not-for-sale" && <b>{formatPrice(item.price, item.currency)}</b>}</div>{canAcquire ? <button disabled>Inquiries opening soon</button> : <strong>{statusLabel(item.availabilityStatus)}</strong>}</div><dl className="artifact-key-facts"><div><dt>Type</dt><dd>{categoryLabel(item.category)}</dd></div><div><dt>Artist</dt><dd>{item.illustrator || item.artist || "Not identified"}</dd></div><div><dt>Date</dt><dd>{item.approximateYear ? `c. ${item.year || "undated"}` : item.year || "Undated"}</dd></div><div><dt>Series</dt><dd>{[item.set, item.series].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Origin</dt><dd>{item.country} · {item.language}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div></dl><section className="archival-note"><h2>Why it matters</h2><p>{item.archivalNote}</p></section><div className="object-record-sections"><details open><summary>Details <span>+</span></summary><dl><div><dt>Pokémon</dt><dd>{item.pokemonNames.length ? item.pokemonNames.join(" · ") : "Not assigned"}</dd></div><div><dt>Catalog / card number</dt><dd>{item.cardNumber || item.catalogNumber || "Not recorded"}</dd></div><div><dt>Made by / published by</dt><dd>{[item.manufacturer, item.publisher].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Edition / printing</dt><dd>{[item.edition, item.printing].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Size</dt><dd>{item.dimensions || "Not recorded"}</dd></div><div><dt>Condition notes</dt><dd>{item.conditionNotes}</dd></div></dl></details><details><summary>History <span>+</span></summary><p>{provenance}</p><p>{source}</p></details><details><summary>Photos &amp; rights <span>+</span></summary><dl><div><dt>Photo rights</dt><dd>{item.rightsMetadata}</dd></div><div><dt>Caption</dt><dd>{item.images[imageIndex].caption}</dd></div><div><dt>Use</dt><dd>{item.images[imageIndex].rightsStatus}</dd></div></dl></details></div><div className="artifact-related"><div><span>More to see</span><p>{item.pokemonNames.map((name, index) => <Link key={name} href={`${ARCHIVE_ORIGIN}/#pokemon-${item.pokemonIds[index]}`}>{name} ↗</Link>)}{item.relatedMuseumIds.length > 0 && <Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link>}<Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link></p></div></div><DemoNotice /></article></section><footer className="shop-footer"><span>© Pocket Archives</span><Link href={SHOP_ORIGIN}>Shop</Link></footer></main>;
}
