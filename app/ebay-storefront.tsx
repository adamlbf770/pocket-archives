"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicEbayListing } from "./ebay-storefront-data";
import { EXTERNAL_SHOP_URL } from "./shop/catalog";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ProductCard({ item, priority = false }: { item: PublicEbayListing; priority?: boolean }) {
  return (
    <a className="ebay-product-card" href={item.listingUrl} target="_blank" rel="noreferrer">
      <span className="ebay-product-image">
        <img src={item.frontImage} alt={`${item.name} — ${item.set}`} loading={priority ? "eager" : "lazy"} />
        <i>View on eBay ↗</i>
      </span>
      <span className="ebay-product-copy">
        <small>{item.game} · {item.condition}</small>
        <b>{item.name}</b>
        <span>{item.set}{item.number ? ` · ${item.number}` : ""}</span>
        <strong>{money(item.price)}</strong>
      </span>
    </a>
  );
}

export function StorefrontHome({ featured, categories, counts, total }: { featured: PublicEbayListing[]; categories: PublicEbayListing[]; counts: Record<string, number>; total: number }) {
  const categoryOrder = ["Pokémon", "One Piece Card Game", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"];
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const hero = featured[activeFeature] || featured[0];

  useEffect(() => {
    if (carouselPaused || featured.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveFeature((current) => (current + 1) % featured.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, featured.length]);

  function moveFeature(direction: number) {
    setActiveFeature((current) => (current + direction + featured.length) % featured.length);
  }

  return (
    <>
      <section className="ebay-home-hero">
        <div className="ebay-home-copy">
          <p>Independent collectibles shop</p>
          <h1>Cards worth a closer look.</h1>
          <span>Vintage favorites, new discoveries, and more than {total.toLocaleString()} photographed listings.</span>
          <div>
            <a className="ebay-primary-action" href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">Shop on eBay ↗</a>
            <Link className="ebay-text-action" href="/shop">Browse the storefront →</Link>
          </div>
        </div>
        <div className="ebay-hero-carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)} onFocusCapture={() => setCarouselPaused(true)} onBlurCapture={() => setCarouselPaused(false)}>
          <a className="ebay-hero-feature" href={hero.listingUrl} target="_blank" rel="noreferrer" aria-label={`View ${hero.name} on eBay`}>
            <img key={hero.sku} src={hero.frontImage} alt={`${hero.name} — ${hero.set}`} />
          </a>
          <div className="ebay-carousel-controls" aria-label="Featured listing carousel">
            <button type="button" onClick={() => moveFeature(-1)} aria-label="Previous featured card">←</button>
            <span>{featured.map((item, index) => <button key={item.sku} type="button" className={index === activeFeature ? "is-active" : ""} onClick={() => setActiveFeature(index)} aria-label={`Show ${item.name}`} />)}</span>
            <button type="button" onClick={() => moveFeature(1)} aria-label="Next featured card">→</button>
          </div>
        </div>
      </section>

      <section className="ebay-trust-strip" aria-label="Shopping information">
        <span><b>Actual photos</b> The card shown is the card listed.</span>
        <span><b>One checkout</b> Payment and buyer protection through eBay.</span>
        <span><b>Combined shipping</b> Add several finds to one order.</span>
      </section>

      <section className="ebay-home-section">
        <header className="ebay-section-heading">
          <div><small>Fresh from the shop</small><h2>Pick your game.</h2></div>
          <Link href="/shop">Browse the catalog →</Link>
        </header>
        <div className="ebay-category-grid">
          {categoryOrder.map((game) => {
            const item = categories.find((candidate) => candidate.game === game);
            return item ? (
              <Link key={game} href={`/shop?game=${encodeURIComponent(game)}`} className="ebay-category-card">
                <span><img src={item.frontImage} alt="" loading="lazy" /></span>
                <small>{counts[game]?.toLocaleString() || 0} live listings</small>
                <div><b>{game === "Dragon Ball Super" ? "Dragon Ball" : game === "One Piece Card Game" ? "One Piece" : game.replace(": The Gathering", "")}</b><i>Browse →</i></div>
              </Link>
            ) : null;
          })}
          <div className="ebay-category-card ebay-category-coming">
            <small>Expanding the archive</small>
            <div><b>Sorcery</b><i>Coming soon</i></div>
          </div>
          <a className="ebay-category-card ebay-category-all" href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">
            <small>The complete shop</small>
            <div><b>All {total.toLocaleString()}</b><i>Open eBay ↗</i></div>
          </a>
        </div>
      </section>

      <section className="ebay-collection-section">
        <header className="ebay-section-heading ebay-section-heading-light">
          <div><small>Browse your way</small><h2>Collected across games and eras.</h2></div>
        </header>
        <div className="ebay-collection-links">
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([game, count]) => (
            <Link key={game} href={`/shop?game=${encodeURIComponent(game)}`}>
              <span>{game}</span><b>{count.toLocaleString()}</b><i>Browse →</i>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function EbayCatalog({ listings, total, initialGame = "all" }: { listings: PublicEbayListing[]; total: number; initialGame?: string }) {
  const [query, setQuery] = useState("");
  const [game, setGame] = useState(initialGame);
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(48);
  const games = useMemo(() => [...new Set(listings.map((item) => item.game))].sort(), [listings]);
  const conditions = useMemo(() => [...new Set(listings.map((item) => item.condition))].sort(), [listings]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const results = listings.filter((item) => {
      const searchable = [item.name, item.set, item.number, item.artist, item.rarity, item.language, item.sku].join(" ").toLowerCase();
      return (!needle || searchable.includes(needle)) && (game === "all" || item.game === game) && (condition === "all" || item.condition === condition);
    });
    return [...results].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "oldest") return (a.year || 9999) - (b.year || 9999);
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.listingId) - Number(a.listingId);
    });
  }, [condition, game, listings, query, sort]);

  function updateFilter(action: () => void) {
    action();
    setVisible(48);
  }

  return (
    <>
      <section className="ebay-catalog-intro">
        <div><p>THE POCKET ARCHIVES EBAY STOREFRONT</p><h1>Find something good.</h1></div>
        <p>Explore a rotating selection from {total.toLocaleString()} live listings. Every card uses its actual photos; checkout, shipping, and buyer protection are handled securely by eBay.</p>
      </section>
      <section className="ebay-catalog-controls" aria-label="Store filters">
        <label className="ebay-search"><span>Search</span><input type="search" value={query} onChange={(event) => updateFilter(() => setQuery(event.target.value))} placeholder="Card, set, artist, or number" /></label>
        <label><span>Game</span><select value={game} onChange={(event) => updateFilter(() => setGame(event.target.value))}><option value="all">All games</option>{games.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Condition</span><select value={condition} onChange={(event) => updateFilter(() => setCondition(event.target.value))}><option value="all">All conditions</option>{conditions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => updateFilter(() => setSort(event.target.value))}><option value="newest">Recently listed</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="oldest">Oldest first</option><option value="name">Name</option></select></label>
      </section>
      <section className="ebay-results-bar"><b>{filtered.length.toLocaleString()} shown here</b><a href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">Browse all {total.toLocaleString()} on eBay ↗</a></section>
      {filtered.length ? <section className="ebay-product-grid ebay-catalog-grid">{filtered.slice(0, visible).map((item) => <ProductCard key={item.sku} item={item} />)}</section> : <section className="ebay-empty"><h2>No matches.</h2><button onClick={() => { setQuery(""); setGame("all"); setCondition("all"); }}>Clear filters</button></section>}
      {visible < filtered.length && <button className="ebay-load-more" onClick={() => setVisible((value) => value + 48)}>Show 48 more</button>}
    </>
  );
}
