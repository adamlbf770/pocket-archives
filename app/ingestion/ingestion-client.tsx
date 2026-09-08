"use client";

import { useMemo, useState } from "react";

type Card = {
  sku: string;
  guess: Record<string, unknown>;
  externalMatch: null | { source?: string | null; externalId?: string; identity?: Record<string, unknown> | null; reason?: string; error?: string };
  orientation?: { rotation?: number; confidence?: string; margin?: number };
  quality: { reasons: readonly string[]; rescanRequired: boolean };
  duplicateOf?: string | null;
  confidence: { score: number; grade: string; state: string; reasons: readonly string[] };
};

const labels: Record<string, string> = { AUTO_DRAFT: "Ready for draft", REVIEW: "Needs review", RESCAN: "Rescan", CONFLICT: "Conflict" };

export default function IngestionClient({ snapshot }: { snapshot: { batchId: string; createdAt: string | null; summary: Record<string, number>; cards: readonly Card[] } }) {
  const [filter, setFilter] = useState("ALL");
  const [decisions, setDecisions] = useState<Record<string, { action: string; at: string }>>({});
  const cards = useMemo(() => snapshot.cards.filter((card) => filter === "ALL" || card.confidence.state === filter), [filter, snapshot.cards]);
  const decide = (sku: string, action: string) => setDecisions((current) => ({ ...current, [sku]: { action, at: new Date().toISOString() } }));
  const exportDecisions = () => {
    const blob = new Blob([JSON.stringify({ batchId: snapshot.batchId, exportedAt: new Date().toISOString(), decisions }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${snapshot.batchId}-review-decisions.json`; link.click(); URL.revokeObjectURL(link.href);
  };

  return <>
    <section className="ingestion-filter-bar">
      {["ALL", "REVIEW", "CONFLICT", "RESCAN", "AUTO_DRAFT"].map((state) => <button className={filter === state ? "is-active" : ""} key={state} onClick={() => setFilter(state)}>{state === "ALL" ? "All" : labels[state]} <b>{state === "ALL" ? snapshot.cards.length : snapshot.summary[state] ?? 0}</b></button>)}
      <button className="ingestion-export" disabled={!Object.keys(decisions).length} onClick={exportDecisions}>Export {Object.keys(decisions).length || ""} decisions</button>
    </section>
    <section className="ingestion-queue">
      {!cards.length && <div className="ingestion-empty"><b>No exceptions in this view.</b><span>Run an ingestion batch to populate the queue.</span></div>}
      {cards.map((card) => <article key={card.sku} className={`ingestion-card state-${card.confidence.state.toLowerCase()}`}>
        <header><div><small>{card.sku}</small><h2>{String(card.guess.name || "Unidentified card")}</h2><p>{[card.guess.setName, card.guess.cardNumber, card.guess.language, card.guess.finish].filter(Boolean).join(" · ")}</p></div><span>{labels[card.confidence.state] ?? card.confidence.state}<b>{card.confidence.score}</b></span></header>
        <div className="ingestion-evidence-grid">
          <section><small>Scanner guess</small><dl>{["game", "name", "setName", "setCode", "cardNumber", "language", "finish", "rarity"].map((field) => card.guess[field] ? <div key={field}><dt>{field}</dt><dd>{String(card.guess[field])}</dd></div> : null)}</dl></section>
          <section><small>Catalog evidence</small>{card.externalMatch?.identity ? <><strong>{card.externalMatch.source}</strong><dl>{["name", "setName", "setCode", "cardNumber", "language", "finish"].map((field) => card.externalMatch?.identity?.[field] ? <div key={field}><dt>{field}</dt><dd>{String(card.externalMatch.identity[field])}</dd></div> : null)}</dl></> : <p>{card.externalMatch?.error || card.externalMatch?.reason || "No approved exact match"}</p>}</section>
          <section><small>Safety evidence</small><p>Orientation: {card.orientation?.rotation ?? 0}° ({card.orientation?.confidence ?? "unknown"})</p><p>{card.quality.rescanRequired ? "Scan failed quality gate" : "Scan passed mechanical checks"}</p><ul>{[...card.confidence.reasons, ...card.quality.reasons].map((reason) => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul></section>
        </div>
        <footer><span>{decisions[card.sku] ? `Decision: ${decisions[card.sku].action}` : "No human decision recorded"}</span><div><button onClick={() => decide(card.sku, "ACCEPT_CATALOG") } disabled={!card.externalMatch?.identity}>Accept catalog</button><button onClick={() => decide(card.sku, "MANUAL_CORRECTION")}>Manual correction</button><button onClick={() => decide(card.sku, "RESCAN")}>Rescan</button></div></footer>
      </article>)}
    </section>
  </>;
}
