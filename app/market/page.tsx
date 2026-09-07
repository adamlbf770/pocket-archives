import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { marketSnapshot } from "./market.generated";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Market — Pocket Archives", robots: { index: false, follow: false, nocache: true } };

const dollars = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 100 ? 0 : 2 });
const number = (value: number) => value.toLocaleString("en-US");

function SalesChart({ points }: { points: readonly { date: string; label: string; revenue: number }[] }) {
  const width = 900, height = 230, padX = 24, padY = 24;
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const coords = points.map((point, index) => ({
    ...point,
    x: padX + (index / Math.max(1, points.length - 1)) * (width - padX * 2),
    y: height - padY - (point.revenue / max) * (height - padY * 2),
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;
  return (
    <div className="market-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily sales revenue over the last 30 days">
        <defs><linearGradient id="market-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9bdc69" stopOpacity=".45"/><stop offset="1" stopColor="#9bdc69" stopOpacity="0"/></linearGradient></defs>
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} className="market-gridline" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} className="market-gridline" />
        <polygon points={area} fill="url(#market-area)" />
        <polyline points={line} className="market-trend-line" />
        {coords.filter((point) => point.revenue > 0).map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="4" className="market-trend-dot"><title>{point.label}: {dollars(point.revenue)}</title></circle>)}
      </svg>
      <div><span>{points[0]?.label}</span><span>{points.at(-1)?.label}</span></div>
    </div>
  );
}

export default async function MarketPage() {
  const user = process.env.NODE_ENV === "production" ? await requireChatGPTUser("/market") : { email: "adamlbf@gmail.com", displayName: "Adam", userId: "local", fullName: "Adam" };
  const ownerEmail = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  if (user.email.toLowerCase() !== ownerEmail) notFound();
  const { summary, dailySales, listingValueByGame, salesByGame, marketPosition, sources, generatedAt, topActive } = marketSnapshot;
  const maxGameValue = Math.max(1, ...listingValueByGame.map((item) => item.value));
  const thirtyDayRevenue = dailySales.reduce((total, point) => total + point.revenue, 0);
  const activeSalesDays = dailySales.filter((point) => point.revenue > 0).length;
  const compCoverage = summary.activeListings ? Math.round(summary.comparableListings / summary.activeListings * 100) : 0;
  const positionRows = [
    ["Competitive", marketPosition.counts.competitive ?? 0, "good"],
    ["Priced high", marketPosition.counts["priced-high"] ?? 0, "high"],
    ["Priced low", marketPosition.counts["priced-low"] ?? 0, "low"],
  ] as const;

  return (
    <main className="inventory-app-shell market-app">
      <aside className="inventory-sidebar">
        <Link className="inventory-app-brand" href="/inventory"><span className="inventory-mark" aria-hidden="true"><i /></span><span><b>Pocket Archives</b><small>Inventory OS</small></span></Link>
        <nav aria-label="Pocket Archives app">
          <Link href="/inventory"><span aria-hidden="true">⌂</span>Dashboard</Link>
          <Link href="/inventory#card-search"><span aria-hidden="true">⌕</span>Find a card</Link>
          <Link className="is-active" href="/market"><span aria-hidden="true">↗</span>Market</Link>
          <Link href="/source-health"><span aria-hidden="true">◉</span>Source health</Link>
        </nav>
        <div className="inventory-sidebar-footer"><span>{user.fullName || user.displayName}</span></div>
      </aside>

      <section className="inventory-workspace">
        <header className="inventory-app-header market-page-header">
          <div><small>MARKET INTELLIGENCE</small><h1>Know what the shelves are worth.</h1><p>Sales, listing value, price position, and source coverage in one read-only view.</p></div>
          <div className="market-header-status"><span className="inventory-live-status"><i /> Read only</span><small>Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(generatedAt))}</small></div>
        </header>

        <section className="inventory-stat-grid market-stat-grid" aria-label="Market summary">
          <article className="is-primary"><span>Listed inventory value</span><b>{dollars(summary.listedValue)}</b><small>{number(summary.activeListings)} active listings</small></article>
          <article><span>Recorded revenue</span><b>{dollars(summary.salesRevenue)}</b><small>{number(summary.paidOrders)} paid orders · {number(summary.soldUnits)} units</small></article>
          <article><span>Average order value</span><b>{dollars(summary.averageOrderValue)}</b><small>Across all paid orders recorded</small></article>
          <article className={summary.sevenDayChangePct !== null && summary.sevenDayChangePct < 0 ? "is-caution" : "is-positive"}><span>Revenue · last 7 days</span><b>{dollars(summary.sevenDayRevenue)}</b><small>{summary.sevenDayChangePct === null ? "No prior-week baseline" : `${summary.sevenDayChangePct >= 0 ? "+" : ""}${summary.sevenDayChangePct}% compared with prior 7 days`}</small></article>
        </section>

        <section className="market-context-strip" aria-label="Market data context">
          <span><b>{compCoverage}%</b> of active listings have comparable market data</span>
          <span><b>{number(summary.unshippedOrders)}</b> unshipped {summary.unshippedOrders === 1 ? "order" : "orders"}</span>
          <span><b>{summary.marketPremiumPct === null ? "—" : `${summary.marketPremiumPct > 0 ? "+" : ""}${summary.marketPremiumPct}%`}</b> aggregate premium versus comparable median</span>
        </section>

        <section className="market-dashboard-grid">
          <article className="market-panel market-sales-panel">
            <header><div><small>SALES TREND</small><h2>Daily revenue</h2></div><span>Last 30 days</span></header>
            <div className="market-chart-summary"><span><small>30-day revenue</small><b>{dollars(thirtyDayRevenue)}</b></span><span><small>Days with sales</small><b>{activeSalesDays} / {dailySales.length}</b></span></div>
            <SalesChart points={dailySales} />
          </article>

          <article className="market-panel market-position-panel">
            <header><div><small>PRICE POSITION</small><h2>Current competitiveness</h2></div><span>{number(summary.comparableListings)} covered</span></header>
            <div className="market-position-score"><b>{summary.marketPremiumPct === null ? "—" : `${summary.marketPremiumPct > 0 ? "+" : ""}${summary.marketPremiumPct}%`}</b><span>aggregate premium versus the comparable median</span></div>
            <div className="market-position-bars">{positionRows.map(([label, count, tone]) => <div key={label}><span><b>{label}</b><em>{number(count)}</em></span><i className={`is-${tone}`} style={{ width: `${summary.comparableListings ? Math.max(2, count / summary.comparableListings * 100) : 0}%` }} /></div>)}</div>
            <p>Directional view from the latest full comp sweep. Active asking prices are never treated as realized sales.</p>
          </article>

          <article className="market-panel market-game-panel">
            <header><div><small>PORTFOLIO</small><h2>Listing value by game</h2></div><span>{number(summary.activeListings)} listings</span></header>
            <div className="market-game-bars">{listingValueByGame.slice(0, 7).map((item) => <div key={item.game}><span><b>{item.game}</b><em>{dollars(item.value)} · {number(item.listings)}</em></span><i style={{ width: `${Math.max(3, item.value / maxGameValue * 100)}%` }} /></div>)}</div>
          </article>

          <article className="market-panel market-source-panel">
            <header><div><small>DATA FEEDS</small><h2>Market coverage</h2></div><Link href="/source-health">All sources</Link></header>
            <div className={`market-source-row ${sources.tcgcsv?.status === "connected" ? "is-connected" : "is-warning"}`}><i /><span><b>TCGCSV</b><small>{sources.tcgcsv?.detail || "Awaiting first read"}</small></span><em>{sources.tcgcsv?.status === "connected" ? "Connected" : "Attention"}</em></div>
            <div className={`market-source-row ${sources.pokemonTcgApi?.status === "connected" ? "is-connected" : "is-warning"}`}><i /><span><b>Pokémon TCG API</b><small>{sources.pokemonTcgApi?.detail || "Connection unavailable"}</small></span><em>{sources.pokemonTcgApi?.status === "connected" ? "Connected" : "Degraded"}</em></div>
            <div className={`market-source-row ${sources.scryfall?.status === "connected" ? "is-connected" : "is-warning"}`}><i /><span><b>Scryfall</b><small>{sources.scryfall?.detail || "Connection unavailable"}</small></span><em>{sources.scryfall?.status === "connected" ? "Connected" : "Attention"}</em></div>
            <div className="market-source-row is-locked"><i /><span><b>Card Ladder</b><small>Manual only until licensed API access exists</small></span><em>Protected</em></div>
          </article>

          <article className="market-panel market-sales-mix">
            <header><div><small>SALES MIX</small><h2>Revenue by game</h2></div></header>
            <div>{salesByGame.map((item) => <span key={item.game}><b>{item.game}</b><em>{dollars(item.revenue)} · {number(item.units)} sold</em></span>)}</div>
          </article>

          <article className="market-panel market-top-listings">
            <header><div><small>TOP INVENTORY</small><h2>Highest asking prices</h2></div></header>
            <div>{topActive.slice(0, 5).map((item) => <a key={`${item.sku}-${item.title}`} href={item.url} target="_blank" rel="noreferrer"><span><b>{item.title}</b><small>{item.sku}</small></span><em>{dollars(item.price)}</em></a>)}</div>
          </article>
        </section>

        <footer className="market-footer">Data snapshot {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(generatedAt))}. No prices or listings are changed from this screen.</footer>
      </section>
    </main>
  );
}
