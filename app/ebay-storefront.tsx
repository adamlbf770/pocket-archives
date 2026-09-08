"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

export function StorefrontHome({ featured, curated, categories, counts, total }: { featured: PublicEbayListing[]; curated: PublicEbayListing[]; categories: PublicEbayListing[]; counts: Record<string, number>; total: number }) {
  const categoryOrder = ["Pokémon", "One Piece Card Game", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"];
  const storageKey = "pocket-archives-home-game";
  const [activeGame, setActiveGame] = useState("all");
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressCardClick = useRef(false);
  const gameCards = activeGame === "all" ? curated : curated.filter((item) => item.game === activeGame);
  const hero = gameCards[activeFeature] || gameCards[0] || featured[0];
  const previousHero = gameCards[(activeFeature - 1 + gameCards.length) % gameCards.length] || hero;
  const nextHero = gameCards[(activeFeature + 1) % gameCards.length] || hero;
  const visibleCards = (activeGame === "all" ? featured : gameCards).slice(0, 4);
  const activeTotal = activeGame === "all" ? total : counts[activeGame] || 0;
  const carouselMarkers = gameCards.length <= 7
    ? gameCards.map((_, index) => index)
    : [-2, -1, 0, 1, 2].map((offset) => (activeFeature + offset + gameCards.length) % gameCards.length);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "all" || categoryOrder.includes(saved || "")) setActiveGame(saved || "all");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, activeGame);
    setActiveFeature(0);
  }, [activeGame]);

  useEffect(() => {
    if (carouselPaused || gameCards.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveFeature((current) => (current + 1) % gameCards.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, gameCards.length]);

  function moveFeature(direction: number) {
    setActiveFeature((current) => (current + direction + gameCards.length) % gameCards.length);
  }

  function beginSwipe(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function finishSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
    suppressCardClick.current = true;
    moveFeature(deltaX < 0 ? 1 : -1);
    window.setTimeout(() => { suppressCardClick.current = false; }, 0);
  }

  return (
    <>
      <div className="archive-home">
        <nav className="archive-quick-nav" aria-label="Browse the archive by game">
          <button type="button" className={activeGame === "all" ? "is-active" : ""} aria-pressed={activeGame === "all"} onClick={() => setActiveGame("all")}><span>All cards</span><b>{total.toLocaleString()}</b></button>
          {categoryOrder.map((game) => (
            <button type="button" key={game} className={activeGame === game ? "is-active" : ""} aria-pressed={activeGame === game} onClick={() => setActiveGame(game)}>
              <span>{game === "One Piece Card Game" ? "One Piece" : game === "Dragon Ball Super" ? "Dragon Ball" : game.replace(": The Gathering", "")}</span>
              <b>{counts[game]?.toLocaleString() || 0}</b>
            </button>
          ))}
        </nav>
        <section className="archive-hero">
          <div className="archive-hero-copy">
            <p className="archive-eyebrow">Pocket Archives</p>
            <h1>A curated archive of trading cards.</h1>
            <p className="archive-hero-deck">Each card is photographed front and back, cataloged, and available through our eBay store.</p>
            <form className="archive-search" action="/shop">
              <label htmlFor="archive-home-search">Search the archive</label>
              {activeGame !== "all" && <input type="hidden" name="game" value={activeGame} />}
              <div><input id="archive-home-search" name="q" type="search" placeholder="Card, set, artist, or number" /><button type="submit">Search</button></div>
            </form>
            <div className="archive-hero-actions">
              <Link className="archive-button archive-button-bright" href={activeGame === "all" ? "/shop" : `/shop?game=${encodeURIComponent(activeGame)}`}>Browse cards <span>→</span></Link>
              <a className="archive-button archive-button-quiet" href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">Visit eBay <span>↗</span></a>
            </div>
            <dl className="archive-hero-facts">
              <div><dt>Available</dt><dd>{activeTotal.toLocaleString()}</dd></div>
              <div><dt>Games</dt><dd>{Object.keys(counts).length}</dd></div>
              <div><dt>Photos</dt><dd>Front + back</dd></div>
            </dl>
          </div>

          <div className="archive-feature" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)} onFocusCapture={() => setCarouselPaused(true)} onBlurCapture={() => setCarouselPaused(false)}>
            <div className="archive-feature-index"><span>Featured</span><b>{String(activeFeature + 1).padStart(2, "0")} / {String(gameCards.length).padStart(2, "0")}</b></div>
            <div
              className="archive-feature-stage"
              onPointerDown={beginSwipe}
              onPointerUp={finishSwipe}
              onPointerCancel={() => { swipeStart.current = null; }}
              onClickCapture={(event) => {
                if (!suppressCardClick.current) return;
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <img className="archive-feature-ghost archive-feature-ghost-left" src={previousHero.frontImage} alt="" aria-hidden="true" />
              <a className="archive-feature-card" href={hero.listingUrl} target="_blank" rel="noreferrer" aria-label={`View ${hero.name} on eBay`}>
                <img key={hero.sku} src={hero.frontImage} alt={`${hero.name} — ${hero.set}`} />
              </a>
              <img className="archive-feature-ghost archive-feature-ghost-right" src={nextHero.frontImage} alt="" aria-hidden="true" />
            </div>
            <div className="archive-feature-caption">
              <div><small>{hero.sku} · {hero.game}</small><b>{hero.name}</b><span>{hero.set}{hero.number ? ` · ${hero.number}` : ""}</span></div>
              <div><small>{hero.condition}</small><strong>{money(hero.price)}</strong></div>
            </div>
            <div className="archive-feature-controls" aria-label="Featured listing carousel">
              <button type="button" onClick={() => moveFeature(-1)} aria-label="Previous featured card">←</button>
              <span>{carouselMarkers.map((index) => {
                const item = gameCards[index];
                return <button key={item.sku} type="button" className={index === activeFeature ? "is-active" : ""} onClick={() => setActiveFeature(index)} aria-label={`Show ${item.name}`} />;
              })}</span>
              <button type="button" onClick={() => moveFeature(1)} aria-label="Next featured card">→</button>
            </div>
          </div>
        </section>

        <section className="archive-section archive-new-arrivals">
          <header className="archive-section-header">
            <div><h2>Recently added</h2></div>
            <Link href={activeGame === "all" ? "/shop" : `/shop?game=${encodeURIComponent(activeGame)}`}>View all <span>→</span></Link>
          </header>
          <div className="ebay-product-grid ebay-home-grid">{visibleCards.map((item, index) => <ProductCard key={item.sku} item={item} priority={index < 2} />)}</div>
        </section>

        <section className="archive-section archive-games">
          <header className="archive-section-header">
            <div><h2>Browse by game</h2></div>
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

      </div>
    </>
  );
}

export function EbayCatalog({ listings, total, initialGame = "all", initialQuery = "" }: { listings: PublicEbayListing[]; total: number; initialGame?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
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
