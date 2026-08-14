"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ARCHIVE_ORIGIN, formatPrice, type InventoryItem } from "../shop/catalog";
import { ObjectVisual, ShopHeader } from "../shop/shop-client";
import {
  bidHistoryForLot,
  demoSales,
  lotUrl,
  lotsForSale,
  minimumNextBid,
  objectForLot,
  type AuctionLot,
  type AuctionSale,
} from "./sale-data";

function saleNumber(sale: AuctionSale) { return `SALE ${String(sale.saleNumber).padStart(3, "0")}`; }
function lotNumber(lot: AuctionLot) { return `LOT ${String(lot.lotNumber).padStart(2, "0")}`; }
function closeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(value)).replace(" EDT", " ET").replace(" EST", " ET");
}
function dateRange(sale: AuctionSale) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  return `${formatter.format(new Date(sale.startDate))} — ${formatter.format(new Date(sale.endDate))}`;
}

function DemoMark() {
  return <p className="sale-demo-mark"><span /> Demonstration catalog — no physical objects or real bids</p>;
}

function SaleFooter() {
  return <footer className="shop-footer"><span>© Pocket Archives</span><p><Link href="/sales">Sales</Link><Link href={ARCHIVE_ORIGIN}>Archive ↗</Link></p></footer>;
}

function LotCard({ sale, lot }: { sale: AuctionSale; lot: AuctionLot }) {
  const item = objectForLot(lot);
  if (!item) return null;
  return <Link className="sale-lot-card" href={lotUrl(sale, lot)}><span className="lot-card-number">{lotNumber(lot)}</span><ObjectVisual item={item} /><span className="lot-card-copy"><strong>{item.title}</strong><small>{item.year} {item.set || item.objectType} · {item.country}</small><span><em>Estimate {formatPrice(lot.estimateLow, "USD")}–{formatPrice(lot.estimateHigh, "USD").replace("$", "")}</em><b>{lot.currentBid === null ? `Opening ${formatPrice(lot.openingBid, "USD")}` : `Current ${formatPrice(lot.currentBid, "USD")}`}</b></span></span></Link>;
}

export function SalesLanding() {
  const current = demoSales.find((sale) => sale.status === "Open" || sale.status === "Preview");
  const past = demoSales.filter((sale) => sale.archived);
  return <main className="shop-shell sale-shell"><ShopHeader active="sales" />{current && <section className="sales-landing-hero"><div><DemoMark /><p className="sale-overline">Current Sale</p><span>{saleNumber(current)} · {current.status}</span><h1>{current.title}</h1><p>{current.subtitle}</p><dl><div><dt>Era</dt><dd>{current.era}</dd></div><div><dt>Lots</dt><dd>{current.estimatedLotCount}</dd></div><div><dt>Dates</dt><dd>{dateRange(current)}</dd></div></dl><Link className="sale-primary-link" href={`/sales/${current.slug}`}>View Sale <span>→</span></Link></div><div className="sale-hero-art"><img src={current.heroImage} alt="Bulbasaur card from the demonstration sale" /></div></section>}<section className="past-sales"><header><p>Catalog Archive</p><h2>Past Sales</h2></header>{past.map((sale) => <Link href={`/sales/${sale.slug}`} className="past-sale-row" key={sale.id}><span>{saleNumber(sale)}</span><strong>{sale.title}</strong><small>{sale.estimatedLotCount} lots · {new Date(sale.endDate).getFullYear()}</small><i>View catalog →</i></Link>)}</section><SaleFooter /></main>;
}

export function SaleCatalog({ sale }: { sale: AuctionSale }) {
  const lots = lotsForSale(sale.id);
  return <main className="shop-shell sale-shell"><ShopHeader active="sales" /><section className="sale-catalog-hero"><DemoMark /><Link href="/sales" className="artifact-back">← All sales</Link><div><p>{saleNumber(sale)} · {sale.status}</p><h1>{sale.title}</h1><span>{sale.subtitle}</span></div><aside><p>{sale.description}</p><dl><div><dt>Era</dt><dd>{sale.era}</dd></div><div><dt>Lots</dt><dd>{sale.estimatedLotCount}</dd></div><div><dt>Closes</dt><dd>{dateRange(sale)}</dd></div></dl></aside></section>{lots.length > 0 ? <section className="sale-lots"><header><p>Sale Catalog</p><h2>{lots.length} Lots</h2></header><div className="sale-lot-grid">{lots.map((lot) => <LotCard key={lot.id} sale={sale} lot={lot} />)}</div><aside className="sale-terms-note"><b>Extended bidding</b><p>If a valid bid is placed within the final {sale.antiSniping.triggerMinutes} minutes, that lot’s closing time extends by {sale.antiSniping.extensionMinutes} minutes. Demo only; no bids are accepted.</p></aside></section> : <section className="empty-sale-catalog"><span>Permanent Catalog Record</span><h2>This demonstration sale is archived.</h2><p>The final system will preserve every completed lot, result, condition report, and provenance record here.</p></section>}<SaleFooter /></main>;
}

function LotImageGallery({ item }: { item: InventoryItem }) {
  const [imageIndex, setImageIndex] = useState(0);
  return <div className="sale-lot-gallery"><ObjectVisual item={item} imageIndex={imageIndex} detail />{item.images.length > 1 && <div className="artifact-thumbnails">{item.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={`${image.src}-${index}`} onClick={() => setImageIndex(index)} aria-label={`Show card ${index + 1}`}><img src={image.src} alt="" /></button>)}</div>}</div>;
}

export function LotDetail({ sale, lot, item }: { sale: AuctionSale; lot: AuctionLot; item: InventoryItem }) {
  const minimum = minimumNextBid(lot, sale);
  const [bidAmount, setBidAmount] = useState(String(minimum));
  const [confirming, setConfirming] = useState(false);
  const [demoConfirmed, setDemoConfirmed] = useState(false);
  const [watched, setWatched] = useState(false);
  const history = bidHistoryForLot(lot.id);

  useEffect(() => { setWatched(localStorage.getItem(`pocket-archives-watch-${lot.id}`) === "true"); }, [lot.id]);
  function toggleWatch() {
    const next = !watched;
    setWatched(next);
    localStorage.setItem(`pocket-archives-watch-${lot.id}`, String(next));
  }

  return <main className="shop-shell sale-shell"><ShopHeader active="sales" /><section className="sale-lot-detail"><LotImageGallery item={item} /><article><DemoMark /><Link className="artifact-back" href={`/sales/${sale.slug}`}>← {saleNumber(sale)}</Link><p className="lot-detail-number">{lotNumber(lot)} · {sale.status}</p><h1>{item.title}</h1><p className="artifact-subtitle">{item.year} {item.set || item.objectType} · {item.illustrator || item.artist || "Artist not identified"} · {item.country}</p><div className="lot-bid-summary"><div><span>Estimate</span><b>{formatPrice(lot.estimateLow, "USD")}–{formatPrice(lot.estimateHigh, "USD").replace("$", "")}</b></div><div><span>Current Bid</span><b>{formatPrice(lot.currentBid ?? lot.openingBid, "USD")}</b><small>{lot.bidCount} demonstration bids</small></div><div><span>Closes</span><b>{closeLabel(lot.closingTime)}</b></div></div><section className="demo-bid-panel"><header><div><span>Minimum next bid</span><b>{formatPrice(minimum, "USD")}</b></div><button className={watched ? "active" : ""} onClick={toggleWatch}>{watched ? "Watching ✓" : "Watch Lot"}</button></header><label>Bid amount <span><i>$</i><input inputMode="decimal" aria-label="Demo bid amount" value={bidAmount} onChange={(event) => setBidAmount(event.target.value.replace(/[^0-9]/g, ""))} /></span></label><button className="place-demo-bid" onClick={() => setConfirming(true)} disabled={Number(bidAmount) < minimum}>Preview Bid</button><p>Demonstration only. Authentication, binding bids, proxy bidding, and payments are disabled.</p></section>{demoConfirmed && <p className="demo-confirmed">Bid flow preview complete. No bid was submitted.</p>}<dl className="lot-object-facts"><div><dt>Accession</dt><dd>{item.accessionNumber}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div><div><dt>Publisher</dt><dd>{item.publisher || "Not recorded"}</dd></div><div><dt>Object type</dt><dd>{item.objectType}</dd></div></dl><section className="lot-catalog-note"><span>Catalog Note</span><h2>Why it matters</h2><p>{item.archivalNote}</p></section><details className="lot-record-detail" open><summary>Condition &amp; provenance <span>+</span></summary><p>{item.conditionNotes}</p><p>{item.provenance}</p></details><details className="lot-record-detail"><summary>Bid history <span>+</span></summary><div className="bid-history">{history.map((bid) => <p key={bid.id}><span>{bid.bidderAlias}</span><b>{formatPrice(bid.amount, "USD")}</b><small>Demo</small></p>)}</div></details><div className="lot-related-links"><Link href={`/objects/${item.slug}`}>View object record →</Link>{item.pokemonNames.map((name, index) => <Link href={`${ARCHIVE_ORIGIN}/#pokemon-${item.pokemonIds[index]}`} key={name}>{name} archive ↗</Link>)}</div></article></section>{confirming && <div className="bid-confirmation" role="dialog" aria-modal="true" aria-labelledby="bid-confirmation-title"><button className="bid-dialog-backdrop" onClick={() => setConfirming(false)} aria-label="Cancel bid preview" /><section><span>Demonstration bid</span><h2 id="bid-confirmation-title">Confirm {formatPrice(Number(bidAmount), "USD")}</h2><p>You are previewing a bid of <b>{formatPrice(Number(bidAmount), "USD")}</b> on {lotNumber(lot)}. This is not binding and will not be submitted.</p><div><button onClick={() => setConfirming(false)}>Cancel</button><button onClick={() => { setConfirming(false); setDemoConfirmed(true); }}>Confirm Demo Bid</button></div></section></div>}<SaleFooter /></main>;
}

