import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import IngestionClient from "./ingestion-client";
import { ingestionSnapshot } from "./ingestion.generated";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ingestion — Pocket Archives", robots: { index: false, follow: false, nocache: true } };

export default async function IngestionPage() {
  const user = process.env.NODE_ENV === "production" ? await requireChatGPTUser("/ingestion") : { email: "adamlbf@gmail.com", displayName: "Adam", fullName: "Adam" };
  if (user.email.toLowerCase() !== (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase()) notFound();
  const summary = ingestionSnapshot.summary;
  return <main className="inventory-app-shell ingestion-app">
    <aside className="inventory-sidebar"><Link className="inventory-app-brand" href="/inventory"><span className="inventory-mark" aria-hidden="true"><i /></span><span><b>Pocket Archives</b><small>Inventory OS</small></span></Link><nav aria-label="Pocket Archives app"><Link href="/inventory"><span>⌂</span>Dashboard</Link><Link href="/inventory#card-search"><span>⌕</span>Find a card</Link><Link className="is-active" href="/ingestion"><span>⇣</span>Ingestion</Link><Link href="/market"><span>↗</span>Market</Link><Link href="/source-health"><span>◉</span>Source health</Link></nav><div className="inventory-sidebar-footer"><span>{user.fullName || user.displayName}</span></div></aside>
    <section className="inventory-workspace"><header className="inventory-app-header"><div><small>CONTROLLED INTAKE</small><h1>Ingestion review</h1><p>Only exact, high-confidence matches can reach eBay drafts.</p></div><span className="inventory-live-status"><i /> Draft-only lock</span></header>
      <section className="inventory-stat-grid"><article><span>Batch</span><b>{ingestionSnapshot.cards.length}</b><small>{ingestionSnapshot.batchId}</small></article><article><span>Ready</span><b>{summary.AUTO_DRAFT}</b><small>Exact matches eligible for drafts</small></article><article className="is-caution"><span>Needs review</span><b>{summary.REVIEW + summary.CONFLICT}</b><small>Ambiguity or source conflict</small></article><article><span>Rescan</span><b>{summary.RESCAN}</b><small>Image quality failed</small></article></section>
      <IngestionClient snapshot={ingestionSnapshot} />
    </section>
  </main>;
}
