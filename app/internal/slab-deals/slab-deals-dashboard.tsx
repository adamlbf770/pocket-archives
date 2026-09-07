"use client";

import { useMemo, useState } from "react";

type Snapshot = {
  readonly runAt: string | null;
  readonly source: { readonly name: string; readonly updatedAt: string | null; readonly realizedSoldCompCount: number; readonly ready: boolean; readonly note: string };
  readonly summary: Readonly<Record<string, number>>;
  readonly candidates: readonly Candidate[];
};

type Candidate = {
  readonly itemId: string;
  readonly title: string;
  readonly hunter: string;
  readonly language: string;
  readonly grader: string;
  readonly grade: string;
  readonly seller: string;
  readonly sellerFeedback: string;
  readonly itemPrice: number;
  readonly shipping: number;
  readonly estimatedTax: number;
  readonly landedCost: number;
  readonly recentSoldMedian: number | null;
  readonly recentSoldRange: { readonly low: number | null; readonly high: number | null };
  readonly compCount: number;
  readonly liquidityGrade: string;
  readonly estimatedEbayFees: number | null;
  readonly estimatedOutboundShipping: number;
  readonly expectedNetProfit: number | null;
  readonly expectedRoiPercent: number | null;
  readonly discountToSoldMarketPercent: number | null;
  readonly rawNmValue: number | null;
  readonly population: number | null;
  readonly offerAvailable: boolean;
  readonly maximumBuyPrice: number | null;
  readonly suggestedOffer: number | null;
  readonly recommendation: string;
  readonly reason: string;
  readonly image: string;
  readonly url: string;
};

const filters = ["ALL", "STRONG BUY", "BUY", "WATCH", "REVIEW", "PASS"];

export default function SlabDealsDashboard({ snapshot }: { snapshot: Snapshot }) {
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => snapshot.candidates.filter((candidate) =>
    (filter === "ALL" || candidate.recommendation === filter) &&
    (!query.trim() || `${candidate.title} ${candidate.grader} ${candidate.grade} ${candidate.language} ${candidate.seller}`.toLowerCase().includes(query.trim().toLowerCase())),
  ), [filter, query, snapshot.candidates]);

  return (
    <>
      <section className={`dealer-source ${snapshot.source.ready ? "ready" : "blocked"}`}>
        <div><small>REALIZED-SALE SOURCE</small><b>{snapshot.source.ready ? "Connected" : "Approval needed"}</b></div>
        <p>{snapshot.source.note}</p>
        <span>{snapshot.source.realizedSoldCompCount.toLocaleString()} verified sales</span>
      </section>
      <section className="dealer-scoreboard" aria-label="Deal recommendation counts">
        {filters.slice(1).map((value) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? "active" : ""}><small>{value}</small><b>{snapshot.summary[value] ?? 0}</b></button>)}
      </section>
      <div className="dealer-controls">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search card, grader, language, or seller…" aria-label="Search deal candidates" />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter recommendation">{filters.map((value) => <option key={value}>{value}</option>)}</select>
        <span>{visible.length} candidates · {snapshot.runAt ? `scanned ${new Date(snapshot.runAt).toLocaleString()}` : "awaiting first scan"}</span>
      </div>
      {visible.length ? <div className="dealer-table-wrap"><table className="dealer-table"><thead><tr><th>Candidate</th><th>Buy math</th><th>Sold market</th><th>Exit math</th><th>Decision</th></tr></thead><tbody>{visible.map((candidate) => <tr key={candidate.itemId}>
        <td><div className="dealer-candidate">{candidate.image ? <img src={candidate.image} alt="" /> : null}<div><a href={candidate.url} target="_blank" rel="noreferrer">{candidate.title}</a><span>{candidate.grader} {candidate.grade} · {candidate.language}</span><small>{candidate.seller}{candidate.sellerFeedback ? ` · ${candidate.sellerFeedback}%` : ""}</small></div></div></td>
        <td><Metric label="Ask" value={money(candidate.itemPrice)} /><Metric label="Shipping" value={money(candidate.shipping)} /><Metric label="Tax est." value={money(candidate.estimatedTax)} /><Metric label="Landed" value={money(candidate.landedCost)} strong /></td>
        <td><Metric label="Median" value={money(candidate.recentSoldMedian)} strong /><Metric label="Range" value={candidate.recentSoldRange.low === null ? "—" : `${money(candidate.recentSoldRange.low)}–${money(candidate.recentSoldRange.high)}`} /><Metric label="Comps" value={String(candidate.compCount)} /><Metric label="Liquidity" value={candidate.liquidityGrade} /></td>
        <td><Metric label="eBay fees" value={money(candidate.estimatedEbayFees)} /><Metric label="Outbound" value={money(candidate.estimatedOutboundShipping)} /><Metric label="Net profit" value={money(candidate.expectedNetProfit)} strong /><Metric label="ROI" value={percent(candidate.expectedRoiPercent)} /></td>
        <td><span className={`dealer-verdict verdict-${candidate.recommendation.toLowerCase().replaceAll(" ", "-")}`}>{candidate.recommendation}</span><p>{candidate.reason}</p>{candidate.offerAvailable ? <div className="dealer-offer"><span>MAX BUY <b>{money(candidate.maximumBuyPrice)}</b></span><span>SUGGEST <b>{money(candidate.suggestedOffer)}</b></span></div> : null}</td>
      </tr>)}</tbody></table></div> : <section className="dealer-empty"><b>No candidates in this view.</b><p>{snapshot.source.ready ? "The scanner has not found anything that clears the selected rules." : "Live listings are being discovered, but none can become a BUY until verified realized sales are connected."}</p></section>}
    </>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <span className={strong ? "metric-strong" : ""}><small>{label}</small>{value}</span>; }
function money(value: number | null) { return value === null ? "—" : `$${value.toFixed(2)}`; }
function percent(value: number | null) { return value === null ? "—" : `${value.toFixed(0)}%`; }
