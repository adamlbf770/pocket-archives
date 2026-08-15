"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ARCHIVE_ORIGIN,
  SHOP_HOME,
  demoInventory,
  formatPrice,
  recordStateLabel,
  shopObjectUrl,
  statusLabel,
  type InventoryItem,
} from "./catalog";
import { currentSale, lotForObject } from "../sales/sale-data";
import {
  binderCollectionSlugs,
  binderObjectIds,
  collectionTypeLabel,
  copiesForObject,
  galleryObjectIds,
  membersForCollection,
  presentationOptions,
  privateSaleObjectIds,
  storeCollections,
  type StoreCollection,
} from "./storefront-data";

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
  if (item.id === "DEMO-002") return "Sugimori Art";
  if (item.id === "DEMO-003" || item.id === "DEMO-004")
    return "Black Star Promos";
  if (item.category === "Carddass") return "Bandai Carddass";
  if (item.tags.includes("Meiji")) return "Meiji Get Cards";
  return "Kanto Starters";
}

export function ShopHeader({ active = "shop" }: { active?: "shop" | "sales" }) {
  return (
    <header className="site-header shop-site-header">
      <Link className="brand" href={SHOP_HOME}>
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
        <Link
          className={active === "shop" ? "active" : ""}
          href={`${SHOP_HOME}#gallery`}
        >
          Gallery
        </Link>
        <Link href={`${SHOP_HOME}#collections`}>Collections</Link>
        <Link href={`${SHOP_HOME}#binder`}>The Binder</Link>
        <Link className={active === "sales" ? "active" : ""} href="/sales">
          Sales
        </Link>
        <Link href={`${SHOP_HOME}#private-sale`}>Private Sale</Link>
      </nav>
    </header>
  );
}

function DemoNotice() {
  return (
    <p className="shop-demo-notice">
      <span aria-hidden="true" /> Live inventory is photographed · Samples are labeled
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
  const sale = currentSale();
  const galleryItems = galleryObjectIds
    .map((id) => demoInventory.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];
  const binderItems = binderObjectIds
    .map((id) => demoInventory.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];
  const binderCollections = binderCollectionSlugs
    .map((slug) =>
      storeCollections.find((collection) => collection.slug === slug),
    )
    .filter(Boolean) as StoreCollection[];
  const privateItems = privateSaleObjectIds
    .map((id) => demoInventory.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];

  return (
    <main className="shop-shell physical-shop">
      <ShopHeader />
      <section className="physical-shop-hero">
        <p>POCKET ARCHIVES / SHOP</p>
        <h1>Collect what matters.</h1>
        <span>
          A curated shop for distinctive cards, collectible pieces, and
          thoughtful sets—chosen for their art, history, and character.
        </span>
      </section>
      <section className="store-gallery" id="gallery">
        <header className="store-room-heading">
          <div>
            <small>Room 01 · Curated picks</small>
            <h2>The Gallery</h2>
          </div>
          <p>
            Selected cards, pieces, and collections with a reason to be here.
          </p>
        </header>
        <div className="store-gallery-grid">
          {galleryItems.map((item, index) => (
            <Link
              className={`store-gallery-object gallery-object-${index + 1}`}
              href={shopObjectUrl(item.slug)}
              key={item.id}
            >
              <ObjectVisual item={item} />
              <span>
                <small>
                  {!item.demo
                    ? "Live inventory · Available"
                    : item.commerceMode === "privateSale"
                    ? "Available by private sale"
                    : item.category === "Curated Collections"
                      ? "Curated collection"
                      : "Selected piece"}
                </small>
                <b>{item.title}</b>
                <em>
                  {item.commerceMode === "privateSale"
                    ? "Request details"
                    : formatPrice(item.price, item.currency)}
                </em>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="store-collections" id="collections">
        <header className="store-room-heading">
          <div>
            <small>Room 02 · Browse by idea</small>
            <h2>Collections</h2>
          </div>
          <p>
            Cards and collectibles brought together by artist, character, era,
            or visual idea.
          </p>
        </header>
        <div className="store-collection-grid">
          {storeCollections.map((collection) => (
            <CollectionCard collection={collection} key={collection.id} />
          ))}
        </div>
      </section>
      <section className="store-binder" id="binder">
        <div className="binder-intro">
          <small>Room 03 · Accessible collecting</small>
          <h2>The Binder</h2>
          <p>
            Open a themed binder to see every card together, or browse
            affordable singles below.
          </p>
          <span>Artist binders · Pokémon binders · selected singles</span>
        </div>
        <div className="binder-content">
          <div className="binder-collection-grid">
            {binderCollections.map((collection) => (
              <BinderCollectionCard
                collection={collection}
                key={collection.id}
              />
            ))}
          </div>
          <div className="binder-singles-heading">
            <span>Singles for your binder</span>
            <small>Generally under $25</small>
          </div>
          <div className="binder-card-grid">
            {binderItems.map((item) => (
              <ArtifactCard item={item} key={item.id} />
            ))}
          </div>
        </div>
      </section>
      {sale && (
        <section className="store-current-sale">
          <span>Current Sale · Demonstration</span>
          <div>
            <small>
              Pocket Archives Sale {String(sale.saleNumber).padStart(3, "0")}
            </small>
            <h2>{sale.title}</h2>
            <p>{sale.subtitle}</p>
          </div>
          <Link href={`/sales/${sale.slug}`}>
            {sale.estimatedLotCount} lots · View Sale →
          </Link>
        </section>
      )}
      <section className="store-private-sale" id="private-sale">
        <header className="store-room-heading">
          <div>
            <small>Room 04 · By appointment</small>
            <h2>Private Sale</h2>
          </div>
          <p>
            Unusual pieces considered quietly, with full condition and
            provenance records.
          </p>
        </header>
        {privateItems.map((item) => (
          <Link
            href={shopObjectUrl(item.slug)}
            className="private-sale-object"
            key={item.id}
          >
            <ObjectVisual item={item} />
            <span>
              <small>Available by Private Sale · Demonstration</small>
              <h3>{item.title}</h3>
              <p>{item.archivalNote}</p>
              <b>Request details →</b>
            </span>
          </Link>
        ))}
      </section>
      <footer className="shop-footer physical-shop-footer">
        <DemoNotice />
        <p>
          <Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link>
          <Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link>
          <Link href="/sales">Sales</Link>
        </p>
      </footer>
    </main>
  );
}

export function ArtifactPage({ item }: { item: InventoryItem }) {
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
                {item.pokemonNames.map((name, index) => (
                  <Link
                    key={name}
                    href={`${ARCHIVE_ORIGIN}/#pokemon-${item.pokemonIds[index]}`}
                  >
                    {name} ↗
                  </Link>
                ))}
                {item.relatedMuseumIds.length > 0 && (
                  <Link href={`${ARCHIVE_ORIGIN}/#museum`}>Museum ↗</Link>
                )}
                <Link href={`${ARCHIVE_ORIGIN}/#archive`}>Archive ↗</Link>
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
