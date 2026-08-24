"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  EXTERNAL_SHOP_URL,
  SHOP_HOME,
  demoInventory,
  formatPrice,
  recordStateLabel,
  shopObjectUrl,
  statusLabel,
  type InventoryItem,
} from "./catalog";
import { lotForObject } from "../sales/sale-data";
import {
  collectionTypeLabel,
  copiesForObject,
  galleryObjectIds,
  membersForCollection,
  presentationOptions,
  storeCollections,
  type StoreCollection,
} from "./storefront-data";
import { useMobileReturn } from "./use-mobile-return";

const sampleDescriptions: Record<string, string> = {
  "DEMO-001":
    "A sample listing for a 1999 Base Set Bulbasaur. The final listing will use photos and notes from the actual card.",
  "DEMO-002": "A sample listing for a 1999 Fossil Haunter.",
  "DEMO-003": "A sample listing for the first Pikachu Black Star Promo.",
  "DEMO-004": "A sample listing for the Ancient Mew Black Star Promo.",
  "DEMO-005":
    "A sample set bringing the three original Base Set starters together.",
  "DEMO-006":
    "A sample pair bringing two classic Ken Sugimori illustrations together.",
  "DEMO-007": "A sample pair of Wizards Black Star Promo cards.",
};

function categoryLabel(category: InventoryItem["category"]) {
  if (category === "Cards") return "Card";
  if (category === "Promos") return "Promo";
  if (category === "Ephemera" || category === "Printed Matter") return "Print";
  if (category === "Curated Collections") return "Set";
  return category;
}

function collectorSetLabel(item: InventoryItem) {
  if (!item.demo) return item.set || "Singles";
  if (item.id === "DEMO-002") return "Sugimori Art";
  if (item.id === "DEMO-003" || item.id === "DEMO-004")
    return "Black Star Promos";
  if (item.category === "Carddass") return "Bandai Carddass";
  if (item.tags.includes("Meiji")) return "Meiji Get Cards";
  return item.set || "Singles";
}

function printedRarityLabel(item: InventoryItem) {
  if (item.category === "Carddass") return "Carddass";
  const recognizedRarities = [
    "Special Illustration Rare",
    "Illustration Rare",
    "Art Rare",
    "Ultra Rare",
    "Secret Rare",
    "Holo Rare",
    "Rare",
    "Uncommon",
    "Common",
    "Promo",
  ];
  return recognizedRarities.find((rarity) => item.tags.includes(rarity)) ?? "Rarity not listed";
}

function isFirstEdition(item: InventoryItem) {
  return [item.edition, item.printing, item.subtitle, ...item.tags]
    .filter((value): value is string => Boolean(value))
    .some((value) => /\b(?:1st|first)\s+edition\b/i.test(value));
}

function rarityLabel(item: InventoryItem) {
  const rarity = printedRarityLabel(item);
  return isFirstEdition(item) ? `1st Edition · ${rarity}` : rarity;
}

const rarityDisplayOrder = [
  "Special Illustration Rare",
  "Illustration Rare",
  "Art Rare",
  "Ultra Rare",
  "Secret Rare",
  "Holo Rare",
  "Rare",
  "Promo",
  "Uncommon",
  "Common",
  "Carddass",
  "Rarity not listed",
];

function raritySortRank(label: string) {
  const firstEdition = label.startsWith("1st Edition · ");
  const printedRarity = label.replace(/^1st Edition · /, "");
  const rarityRank = rarityDisplayOrder.indexOf(printedRarity);
  return (firstEdition ? 0 : rarityDisplayOrder.length) +
    (rarityRank === -1 ? rarityDisplayOrder.length : rarityRank);
}

export function ShopHeader({ active = "shop" }: { active?: "shop" | "sales" }) {
  return (
    <header className="site-header shop-site-header">
      <Link className="brand" href="/" aria-label="Return to Pocket Archives home">
        <span className="brand-mark">
          <img src="/pocket-archives-logo.png" alt="" />
        </span>
        <span>
          POCKET ARCHIVES
          <br />
          SHOP
        </span>
      </Link>
      <nav aria-label="Shop rooms">
        <Link href="/">Home</Link>
        <Link
          className={active === "shop" ? "active" : ""}
          href={`${SHOP_HOME}#gallery`}
        >
          Curated shop
        </Link>
        <Link href={`${SHOP_HOME}#collections`}>Collections</Link>
        <a className="shop-archive-return" href={EXTERNAL_SHOP_URL}>
          Cards on eBay ↗
        </a>
      </nav>
    </header>
  );
}

function DemoNotice() {
  return (
    <p className="shop-demo-notice">
      <span aria-hidden="true" /> Live inventory · Front and back documented
    </p>
  );
}

export function ObjectVisual({
  item,
  imageIndex = 0,
  detail = false,
}: {
  item: InventoryItem;
  imageIndex?: number;
  detail?: boolean;
}) {
  const image = item.images[imageIndex];
  if (!detail && item.category === "Curated Collections" && item.images.length > 1)
    return (
      <span
        className={`artifact-image artifact-image-stack card-count-${Math.min(item.images.length, 3)}`}
      >
        {item.images.slice(0, 3).map((card) => (
          <img key={card.src} src={card.src} alt="" />
        ))}
      </span>
    );
  return (
    <span className={detail ? "artifact-primary" : "artifact-image"}>
      {detail && <small>{image.caption}</small>}
      <img src={image.src} alt={image.caption} />
    </span>
  );
}

function CardViewer({
  item,
  imageIndex,
}: {
  item: InventoryItem;
  imageIndex: number;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; side: "front" | "back" } | null>(null);
  const selectedImage = item.images[imageIndex] || item.images[0];
  const image =
    selectedImage.view === "back"
      ? item.images.find((candidate) => candidate.view === "front") || item.images[0]
      : selectedImage;
  const scannedBack = item.images.find((candidate) => candidate.view === "back");
  const backImage = scannedBack?.src || "/shop/cards/pokemon-card-back.png?v=demo-2";
  const backAlt = scannedBack?.caption || "Demonstration Pokémon trading card back";

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = { x: event.clientX, side };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function continueDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const distance = event.clientX - drag.current.x;
    if (distance < -36) setSide("back");
    if (distance > 36) setSide("front");
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="artifact-primary presentation-360-stage">
      <div className="presentation-360-toolbar">
        <span>Swipe or choose a side</span>
        <div className="presentation-360-controls" aria-label="Choose card side">
          <button className={side === "front" ? "active" : ""} aria-pressed={side === "front"} onClick={() => setSide("front")}>Front</button>
          <button className={side === "back" ? "active" : ""} aria-pressed={side === "back"} onClick={() => setSide("back")}>Back</button>
        </div>
      </div>
      <div className="presentation-perspective" onPointerDown={beginDrag} onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className={`presentation-object presentation-object-raw presentation-side-${side} ${dragging ? "dragging" : ""}`}>
          <div key={side} className="presentation-face">
            {side === "front" ? (
              <img className="presentation-card-image" src={image.src} alt={image.caption} draggable={false} />
            ) : (
              <img className="presentation-card-image presentation-card-back-image" src={backImage} alt={backAlt} draggable={false} />
            )}
          </div>
        </div>
      </div>
      <small>{image.caption}</small>
    </div>
  );
}

function ArtifactCard({ item }: { item: InventoryItem }) {
  const label =
    item.category === "Curated Collections"
      ? item.title
      : collectorSetLabel(item);
  const price =
    item.commerceMode === "privateSale"
      ? "Private sale"
      : formatPrice(item.price, item.currency);
  return (
    <Link
      className="artifact-card"
      href={shopObjectUrl(item.slug)}
      aria-label={`${label}, ${price}`}
    >
      <ObjectVisual item={item} />
      <span className="artifact-card-copy simple-card-copy">
        <small>{label}</small>
        <b>{price}</b>
      </span>
    </Link>
  );
}

function CollectionVisual({ collection }: { collection: StoreCollection }) {
  return (
    <span
      className={`store-collection-visual image-count-${Math.min(collection.heroImages.length, 3)}`}
    >
      {collection.heroImages.slice(0, 3).map((src, index) => (
        <img key={`${src}-${index}`} src={src} alt="" />
      ))}
    </span>
  );
}

function CollectionCard({ collection }: { collection: StoreCollection }) {
  return (
    <Link
      className="store-collection-card"
      href={`/collections/${collection.slug}`}
    >
      <CollectionVisual collection={collection} />
      <span>
        <small>
          {collection.category} · {collectionTypeLabel(collection.type)}
        </small>
        <b>{collection.title}</b>
        <em>{collection.subtitle}</em>
      </span>
    </Link>
  );
}

function BinderCollectionCard({ collection }: { collection: StoreCollection }) {
  const members = membersForCollection(collection);
  return (
    <Link
      className="binder-collection-card"
      href={`/collections/${collection.slug}`}
    >
      <span className="binder-page-preview">
        {members.slice(0, 9).map((member) => (
          <img src={member.image} alt="" key={member.id} />
        ))}
      </span>
      <span className="binder-collection-copy">
        <small>Complete binder · {members.length} cards</small>
        <b>{collection.title}</b>
        <em>{collection.subtitle}</em>
        <i>Open binder →</i>
      </span>
    </Link>
  );
}

export function ShopLanding() {
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const galleryItems = galleryObjectIds
    .map((id) => demoInventory.find((item) => item.id === id))
    .filter((item): item is InventoryItem => Boolean(item && !item.demo));

  const sets = useMemo(
    () => [...new Set(galleryItems.map((item) => item.set).filter(Boolean) as string[])].sort(),
    [galleryItems],
  );
  const rarities = useMemo(
    () => [...new Set(galleryItems.map(rarityLabel))].sort((a, b) => raritySortRank(a) - raritySortRank(b)),
    [galleryItems],
  );
  const conditions = useMemo(
    () => [...new Set(galleryItems.map((item) => item.condition))].sort(),
    [galleryItems],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesPrice = (item: InventoryItem) => {
      if (priceFilter === "all") return true;
      const price = item.price ?? 0;
      if (priceFilter === "under-2") return price < 2;
      if (priceFilter === "2-5") return price >= 2 && price < 5;
      if (priceFilter === "5-10") return price >= 5 && price < 10;
      return price >= 10;
    };
    const results = galleryItems.filter((item) => {
      const searchable = [item.title, item.set, item.series, item.cardNumber, item.artist, item.condition, rarityLabel(item), ...item.pokemonNames]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (setFilter === "all" || item.set === setFilter) &&
        (rarityFilter === "all" || rarityLabel(item) === rarityFilter) &&
        (conditionFilter === "all" || item.condition === conditionFilter) &&
        matchesPrice(item)
      );
    });
    return [...results].sort((a, b) => {
      if (sort === "price-low") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-high") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "oldest") return a.year - b.year;
      if (sort === "newest") return b.year - a.year;
      if (sort === "name") return a.title.localeCompare(b.title);
      return galleryItems.indexOf(a) - galleryItems.indexOf(b);
    });
  }, [galleryItems, query, setFilter, rarityFilter, conditionFilter, priceFilter, sort]);
  const rarityGroups = useMemo(
    () =>
      rarities
        .map((rarity) => ({
          rarity,
          items: filteredItems.filter((item) => rarityLabel(item) === rarity),
        }))
        .filter((group) => group.items.length > 0),
    [filteredItems, rarities],
  );
  const hasFilters = Boolean(query || setFilter !== "all" || rarityFilter !== "all" || conditionFilter !== "all" || priceFilter !== "all" || sort !== "featured");

  function clearFilters() {
    setQuery("");
    setSetFilter("all");
    setRarityFilter("all");
    setConditionFilter("all");
    setPriceFilter("all");
    setSort("featured");
  }

  return (
    <main className="shop-shell physical-shop">
      <ShopHeader />
      <section className="physical-shop-hero">
        <p>POCKET ARCHIVES / SHOP</p>
        <h1>Selected with a reason.</h1>
        <span>
          Collections. Ephemera. Vintage finds.
        </span>
      </section>
      <section className="store-gallery curated-storefront" id="gallery">
        <header className="store-room-heading">
          <div>
            <small>Website shop</small>
            <h2>Curated offerings</h2>
          </div>
          <p>
            Small releases, assembled by Pocket Archives.
          </p>
        </header>
        <div className="curated-storefront-grid">
          <article>
            <span>01</span>
            <small>Curated collections</small>
            <h3>Cards that belong together.</h3>
            <p>Artists, characters, and complete small sets.</p>
          </article>
          <article>
            <span>02</span>
            <small>Ephemera &amp; print</small>
            <h3>More than the card game.</h3>
            <p>Postcards, inserts, magazines, and promos.</p>
          </article>
          <article>
            <span>03</span>
            <small>Vintage highlights</small>
            <h3>Selected pieces with context.</h3>
            <p>Older material worth a closer presentation.</p>
          </article>
        </div>
        <div className="curated-storefront-status">
          <small>First release in preparation</small>
          <h3>Coming soon.</h3>
        </div>
      </section>
      <footer className="shop-footer physical-shop-footer">
        <DemoNotice />
        <p>
          <Link href="/">Pocket Archives</Link>
          <a href={EXTERNAL_SHOP_URL}>Individual cards on eBay ↗</a>
        </p>
      </footer>
    </main>
  );
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
  useMobileReturn(SHOP_HOME);
  const [imageIndex, setImageIndex] = useState(0);
  const copies = copiesForObject(item.id);
  const memberships = storeCollections.filter((collection) =>
    collection.physicalCopyIds.some((copyId) =>
      copies.some((copy) => copy.id === copyId),
    ),
  );
  const privateSale = item.commerceMode === "privateSale";
  const canAcquire =
    item.commerceMode === "fixedPrice" &&
    item.availabilityStatus === "available" &&
    item.quantity > 0;
  const description = item.demo
    ? sampleDescriptions[item.id] || item.description
    : item.description;
  const provenance = item.demo
    ? "Sample listing; no physical item is represented."
    : item.provenance;
  const source = item.demo
    ? "Waiting for photos from the live inventory."
    : item.sourceMetadata;
  const relatedLot = lotForObject(item.id);
  return (
    <main className="shop-shell">
      <ShopHeader />
      <section className="artifact-detail">
        <div className="artifact-gallery">
          {item.category === "Curated Collections" ? <ObjectVisual item={item} imageIndex={imageIndex} detail /> : <CardViewer item={item} imageIndex={imageIndex} />}
          {item.images.filter((image) => image.view !== "back").length > 1 && (
            <div className="artifact-thumbnails">
              {item.images.map((image, index) => ({ image, index })).filter(({ image }) => image.view !== "back").map(({ image, index }) => (
                <button
                  className={index === imageIndex ? "active" : ""}
                  key={`${image.src}-${index}`}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Show ${image.view} photograph`}
                >
                  <img src={image.src} alt="" />
                  <span>{image.view}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <article className="artifact-record">
          <Link className="artifact-back" href={SHOP_HOME}>
            ← Back to shop
          </Link>
          <p className="artifact-kicker">
            {item.accessionNumber} · {item.year || "Undated"} · {item.country}
          </p>
          <h1>{item.title}</h1>
          <p className="artifact-subtitle">
            {item.subtitle
              .replace("demonstration record", "sample listing")
              .replace("archived demo", "sample listing")
              .replace("collection demo", "sample listing")}
          </p>
          {item.fromArchive && (
            <p className="from-archive-mark">
              From the Pocket Archives Collection
            </p>
          )}
          <p className="artifact-description">{description}</p>
          <div className={`artifact-offer state-${item.availabilityStatus}`}>
            <div>
              <span>
                {privateSale
                  ? "Available by Private Sale"
                  : recordStateLabel(item.recordState)}
              </span>
              {!privateSale &&
                item.price !== null &&
                item.availabilityStatus !== "not-for-sale" && (
                  <b>{formatPrice(item.price, item.currency)}</b>
                )}
            </div>
            {privateSale ? (
              <button disabled>Request details</button>
            ) : canAcquire ? (
              <button disabled>Inquiries opening soon</button>
            ) : (
              <strong>{statusLabel(item.availabilityStatus)}</strong>
            )}
          </div>
          {relatedLot && (
            <Link
              className="related-sale-link"
              href={`/sales/the-sugimori-years/lots/${String(relatedLot.lotNumber).padStart(2, "0")}`}
            >
              <span>Related demonstration lot</span>
              <b>
                Sale 001 · Lot {String(relatedLot.lotNumber).padStart(2, "0")}
              </b>
              <i>View lot →</i>
            </Link>
          )}
          <dl className="artifact-key-facts">
            <div>
              <dt>Type</dt>
              <dd>{categoryLabel(item.category)}</dd>
            </div>
            <div>
              <dt>Artist</dt>
              <dd>{item.illustrator || item.artist || "Not identified"}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>
                {item.approximateYear
                  ? `c. ${item.year || "undated"}`
                  : item.year || "Undated"}
              </dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>
                {[item.set, item.series].filter(Boolean).join(" · ") ||
                  "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>
                {item.country} · {item.language}
              </dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>{item.condition}</dd>
            </div>
          </dl>
          <section className="archival-note">
            <h2>Why it matters</h2>
            <p>{item.archivalNote}</p>
          </section>
          <div className="object-record-sections">
            <details open>
              <summary>
                Exact physical copy <span>+</span>
              </summary>
              <dl>
                <div>
                  <dt>Copy ID</dt>
                  <dd>
                    {copies.map((copy) => copy.id).join(" · ") ||
                      "Demo copy not assigned"}
                  </dd>
                </div>
                <div>
                  <dt>Current allocation</dt>
                  <dd>
                    {copies
                      .map(
                        (copy) =>
                          `${copy.allocation.mode}${copy.allocation.referenceId ? ` · ${copy.allocation.referenceId}` : ""}`,
                      )
                      .join(" / ") || "Pending intake"}
                  </dd>
                </div>
                <div>
                  <dt>Storage</dt>
                  <dd>
                    {copies.map((copy) => copy.storageLocation).join(" · ") ||
                      "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Ownership</dt>
                  <dd>
                    {copies.some((copy) => copy.consigned)
                      ? "Consigned"
                      : "Pocket Archives"}
                  </dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>
                Item details <span>+</span>
              </summary>
              <dl>
                <div>
                  <dt>Pokémon</dt>
                  <dd>
                    {item.pokemonNames.length
                      ? item.pokemonNames.join(" · ")
                      : "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt>Catalog / card number</dt>
                  <dd>
                    {item.cardNumber || item.catalogNumber || "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Made by / published by</dt>
                  <dd>
                    {[item.manufacturer, item.publisher]
                      .filter(Boolean)
                      .join(" · ") || "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Edition / printing</dt>
                  <dd>
                    {[item.edition, item.printing]
                      .filter(Boolean)
                      .join(" · ") || "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{item.dimensions || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Condition notes</dt>
                  <dd>{item.conditionNotes}</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>
                History <span>+</span>
              </summary>
              <p>{provenance}</p>
              <p>{source}</p>
            </details>
            <details>
              <summary>
                Photos &amp; rights <span>+</span>
              </summary>
              <dl>
                <div>
                  <dt>Photo rights</dt>
                  <dd>{item.rightsMetadata}</dd>
                </div>
                <div>
                  <dt>Caption</dt>
                  <dd>{item.images[imageIndex].caption}</dd>
                </div>
                <div>
                  <dt>Use</dt>
                  <dd>{item.images[imageIndex].rightsStatus}</dd>
                </div>
              </dl>
            </details>
          </div>
          <div className="artifact-related">
            <div>
              <span>Collections &amp; related rooms</span>
              <p>
                {memberships.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                  >
                    {collection.title} →
                  </Link>
                ))}
                <Link href={SHOP_HOME}>Continue shopping →</Link>
              </p>
            </div>
          </div>
          <DemoNotice />
        </article>
      </section>
      <footer className="shop-footer">
        <span>© Pocket Archives</span>
        <Link href={SHOP_HOME}>Shop</Link>
      </footer>
    </main>
  );
}

export function CollectionExperience({
  collection,
}: {
  collection: StoreCollection;
}) {
  useMobileReturn(`${SHOP_HOME}#collections`);
  const members = membersForCollection(collection);
  return (
    <main className="shop-shell collection-experience">
      <ShopHeader />
      <section className="collection-experience-hero">
        <div>
          <Link className="artifact-back" href={`${SHOP_HOME}#collections`}>
            ← All collections
          </Link>
          <p>
            {collection.category} · {collectionTypeLabel(collection.type)} ·
            Demo
          </p>
          <h1>{collection.title}</h1>
          <span>{collection.subtitle}</span>
          <dl>
            <div>
              <dt>Era</dt>
              <dd>{collection.era}</dd>
            </div>
            <div>
              <dt>Pieces included</dt>
              <dd>{members.length}</dd>
            </div>
            <div>
              <dt>Physical copies allocated</dt>
              <dd>{collection.physicalCopyIds.length}</dd>
            </div>
          </dl>
        </div>
        <CollectionVisual collection={collection} />
      </section>
      <section className="collection-curator-intro">
        <span>Curator’s introduction</span>
        <p>{collection.description}</p>
        <blockquote>{collection.curatorNote}</blockquote>
      </section>
      <section className="collection-member-room">
        <header className="store-room-heading">
          <div>
            <small>The collection</small>
            <h2>Included pieces</h2>
          </div>
          <p>
            One collecting idea, expressed through a thoughtful group of cards
            and pieces.
          </p>
        </header>
        <div className="collection-member-grid">
          {members.map((member) => {
            const content = (
              <>
                <span className="collection-member-image">
                  <img src={member.image} alt={member.label} />
                </span>
                <span>
                  <small>{member.status}</small>
                  <b>{member.label}</b>
                  <em>
                    {member.physicalCopyIds.join(" · ") ||
                      "Collection guide record"}
                  </em>
                </span>
              </>
            );
            return member.publicObjectId ? (
              <Link
                href={shopObjectUrl(
                  demoInventory.find(
                    (item) => item.id === member.publicObjectId,
                  )!.slug,
                )}
                key={member.id}
              >
                {content}
              </Link>
            ) : (
              <article key={member.id}>{content}</article>
            );
          })}
        </div>
      </section>
      <section className="collection-presentation-room">
        <div>
          <small>Physical edition</small>
          <h2>Made to be kept together.</h2>
          <p>
            Eligible physical sets can be presented with an archival binder,
            title page, curator note, piece list, numbered positions, and a QR
            link back to this collection page.
          </p>
        </div>
        <aside>
          <span>Available presentation studies</span>
          {collection.presentationOptionIds.map((id) => {
            const option = presentationOptions.find(
              (choice) => choice.id === id,
            );
            return option?.available ? (
              <p key={id}>
                <b>{option.label}</b>
                <small>
                  {option.priceAdjustment
                    ? `+${formatPrice(option.priceAdjustment, "USD")}`
                    : "Included"}
                </small>
              </p>
            ) : null;
          })}
        </aside>
      </section>
      <footer className="shop-footer">
        <span>© Pocket Archives</span>
        <Link href={`${SHOP_HOME}#collections`}>Collections</Link>
      </footer>
    </main>
  );
}
