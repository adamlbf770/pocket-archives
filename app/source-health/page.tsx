import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { sourceHealthSnapshot } from "./source-health.generated";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Source Health — Pocket Archives",
  description: "Private source freshness and connection health for Pocket Archives market intelligence.",
  robots: { index: false, follow: false, nocache: true },
};

const statusLabel = (status: string) => ({
  connected: "Connected",
  access_pending: "Access pending",
  not_configured: "Not configured",
  manual: "Manual",
  blocked: "Do not use",
}[status] ?? status);

function formatTimestamp(value: string | null) {
  if (!value) return "No automated update";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function formatAge(value: string | null) {
  if (!value) return "Age unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m old`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h old`;
  return `${Math.floor(hours / 24)}d old`;
}

export default async function SourceHealthPage() {
  const user = process.env.NODE_ENV === "production"
    ? await requireChatGPTUser("/source-health")
    : { email: "adamlbf@gmail.com", displayName: "Adam", userId: "local", fullName: "Adam" };
  const ownerEmail = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  if (user.email.toLowerCase() !== ownerEmail) notFound();

  const { summary, sources, generatedAt } = sourceHealthSnapshot;

  return (
    <main className="inventory-app-shell source-health-app">
      <aside className="inventory-sidebar">
        <Link className="inventory-app-brand" href="/inventory">
          <span className="inventory-mark" aria-hidden="true"><i /></span>
          <span><b>Pocket Archives</b><small>Inventory OS</small></span>
        </Link>
        <nav aria-label="Pocket Archives app">
          <Link href="/inventory"><span aria-hidden="true">⌂</span>Dashboard</Link>
          <Link href="/inventory#card-search"><span aria-hidden="true">⌕</span>Find a card</Link>
          <Link className="is-active" href="/source-health"><span aria-hidden="true">◉</span>Source health</Link>
        </nav>
        <div className="inventory-sidebar-footer"><span>{user.fullName || user.displayName}</span></div>
      </aside>

      <section className="inventory-workspace">
        <header className="inventory-app-header">
          <div><small>SYSTEM</small><h1>Source health</h1></div>
          <span className="inventory-live-status"><i /> Read only</span>
        </header>

        <section className="inventory-stat-grid" aria-label="Source health summary">
          <article><span>Canonical SKUs</span><b>{summary.uniqueInventorySkus.toLocaleString()}</b><small>Inventory remains authoritative</small></article>
          <article><span>Active listings</span><b>{summary.activeListings.toLocaleString()}</b><small>{summary.activeListingsMissingSku} missing SKU</small></article>
          <article><span>Connected feeds</span><b>{summary.connected}</b><small>{summary.attention} still need access</small></article>
          <article><span>Realized comps</span><b>{summary.realizedMarketComps}</b><small>Pricing stays locked without evidence</small></article>
        </section>

        <section className="source-health-compact-lock">
          <span><i /> Safety lock active</span>
          <p>No automatic repricing, publishing, deletion, buying, or offer acceptance.</p>
        </section>

        <details className="source-health-details">
          <summary><span><b>Data connections</b><small>See freshness, access, and confidence for all {sources.length} sources</small></span><i>+</i></summary>
          <section className="source-health-table" aria-label="Market source registry">
            <header><span>Source</span><span>Access</span><span>Last update</span><span>Confidence</span></header>
            {sources.map((source) => (
              <article key={source.id} className={`status-${source.status}`}>
                <div><small>{source.kind}</small><b>{source.name}</b><p>{source.note}</p></div>
                <div><span className="source-status">{statusLabel(source.status)}</span><small>{source.integrationType}</small></div>
                <div><b>{formatTimestamp(source.lastSuccessAt)}</b><small>{formatAge(source.lastSuccessAt)}</small><small>{source.detail}</small></div>
                <div><strong>{source.confidence}</strong><small>{source.capabilities.length ? source.capabilities.join(" · ") : "No approved capabilities"}</small></div>
              </article>
            ))}
          </section>
        </details>

        <footer className="source-health-footer">Snapshot generated {formatTimestamp(generatedAt)}</footer>
      </section>
    </main>
  );
}
