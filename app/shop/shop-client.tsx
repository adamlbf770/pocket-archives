"use client";

import Link from "next/link";
import { useState } from "react";
import { ARCHIVE_ORIGIN, SHOP_ORIGIN, demoInventory, formatPrice, recordStateLabel, shopObjectUrl, statusLabel, type InventoryItem } from "./catalog";

const collectorSets = ["All", "Sugimori Art", "Kanto Starters", "Black Star Promos"] as const;
type CollectorSet = typeof collectorSets[number];

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

function collectorSetLabel(item: InventoryItem): Exclude<CollectorSet, "All"> {
  if (item.id === "DEMO-002") return "Sugimori Art";
  if (item.id === "DEMO-003" || item.id === "DEMO-004") return "Black Star Promos";
  return "Kanto Starters";
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
  return <Link className="artifact-card" href={shopObjectUrl(item.slug)}><ObjectVisual item={item} /><span className="artifact-card-copy simple-card-copy"><small>{collectorSetLabel(item)}</small><b>{formatPrice(item.price, item.currency)}</b></span></Link>;
}

export function ShopLanding() {
  const [selectedSet, setSelectedSet] = useState<CollectorSet>("All");
  const cards = selectedSet === "All" ? demoInventory : demoInventory.filter((item) => collectorSetLabel(item) === selectedSet);

  return <main className="shop-shell"><ShopHeader /><section className="simple-shop-content"><nav className="collector-set-tabs" aria-label="Collector sets">{collectorSets.map((set) => <button key={set} className={selectedSet === set ? "active" : ""} onClick={() => setSelectedSet(set)}>{set}</button>)}</nav><div className="artifact-grid simple-shop-grid">{cards.map((item) => <ArtifactCard key={item.id} item={item} />)}</div></section><footer className="shop-footer"><DemoNotice /><Link href={`${ARCHIVE_ORIGIN}/#archive`}>Visit the Archive ↗</Link></footer></main>;
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
  const [imageIndex, setImageIndex] = useState(0);
  const canAcquire = item.availabilityStatus === "available" && item.quantity > 0;
  const description = item.demo ? sampleDescriptions[item.id] : item.description;
  const provenance = item.demo ? "Sample listing; no physical item is represented." : item.provenance;
  const source = item.demo ? "Waiting for photos from the live inventory." : item.sourceMetadata;
  return <main className="shop-shell"><ShopHeader /><section className="artifact-detail"><div className="artifact-gallery"><ObjectVisual item={item} imageIndex={imageIndex} detail />{item.images.length > 1 && <div className="artifact-thumbnails">{item.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={`${image.src}-${index}`} onClick={() => setImageIndex(index)} aria-label={`Show ${image.view} photograph`}><img src={image.src} alt="" /><span>{image.view}</span></button>)}</div>}</div><article className="artifact-record"><Link className="artifact-back" href={SHOP_ORIGIN}>← Back to shop</Link><p className="artifact-kicker">{item.accessionNumber} · {item.year || "Undated"} · {item.country}</p><h1>{item.title}</h1><p className="artifact-subtitle">{item.subtitle.replace("demonstration record", "sample listing").replace("archived demo", "sample listing").replace("collection demo", "sample listing")}</p>{item.fromArchive && <p className="from-archive-mark">From the Pocket Archives Collection</p>}<p className="artifact-description">{description}</p><div className={`artifact-offer state-${item.availabilityStatus}`}><div><span>{recordStateLabel(item.recordState)}</span>{item.price !== null && item.availabilityStatus !== "not-for-sale" && <b>{formatPrice(item.price, item.currency)}</b>}</div>{canAcquire ? <button disabled>Inquiries opening soon</button> : <strong>{statusLabel(item.availabilityStatus)}</strong>}</div><dl className="artifact-key-facts"><div><dt>Type</dt><dd>{categoryLabel(item.category)}</dd></div><div><dt>Artist</dt><dd>{item.illustrator || item.artist || "Not identified"}</dd></div><div><dt>Date</dt><dd>{item.approximateYear ? `c. ${item.year || "undated"}` : item.year || "Undated"}</dd></div><div><dt>Series</dt><dd>{[item.set, item.series].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Origin</dt><dd>{item.country} · {item.language}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div></dl><section className="archival-note"><h2>Why it matters</h2><p>{item.archivalNote}</p></section><div className="object-record-sections"><details open><summary>Details <span>+</span></summary><dl><div><dt>Pokémon</dt><dd>{item.pokemonNames.length ? item.pokemonNames.join(" · ") : "Not assigned"}</dd></div><div><dt>Catalog / card number</dt><dd>{item.cardNumber || item.catalogNumber || "Not recorded"}</dd></div><div><dt>Made by / published by</dt><dd>{[item.manufacturer, item.publisher].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Edition / printing</dt><dd>{[item.edition, item.printing].filter(Boolean).join(" · ") || "Not recorded"}</dd></div><div><dt>Size</dt><dd>{item.dimensions || "Not recorded"}</dd></div><div><dt>Condition notes</dt><dd>{item.conditionNotes}</dd></div></dl></details><details><summary>History <span>+</span></summary><p>{provenance}</p><p>{source}</p></details><details><summary>Photos &amp; rights <span>+</span></summary><dl><div><dt>Photo rights</dt><dd>{item.rightsMetadata}</dd></div><div><dt>Caption</dt><dd>{item.images[imageIndex].caption}</dd></div><div><dt>Use</dt><dd>{item.images[imageIndex].rightsStatus}</dd></div></dl></details></div><div className="artifact-related"><div><span>More to see</span><p>{item.pokemonNames.map((name, index) => <Link key={name} href={`${ARCHIVE_ORIGIN}/#pokemon-${item.pokemonIds[index]}`}>{name} ↗</Link>)}{item.relatedMuseumIds.length > 0 && <Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link>}<Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link></p></div></div><DemoNotice /></article></section><footer className="shop-footer"><span>© Pocket Archives</span><Link href={SHOP_ORIGIN}>Shop</Link></footer></main>;
}
