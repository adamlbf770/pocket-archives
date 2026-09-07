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
    <main className="source-health-shell">
      <header className="operations-header">
        <Link className="operations-brand" href="/inventory">
          <span className="inventory-mark" aria-hidden="true"><i /></span>
          <span><b>POCKET ARCHIVES</b><small>INTELLIGENCE</small></span>
        </Link>
        <nav aria-label="Pocket Archives operations">
          <Link href="/inventory">Inventory</Link>
          <Link className="is-active" href="/source-health">Source Health</Link>
        </nav>
        <div className="inventory-owner"><span>Signed in as</span><b>{user.fullName || user.displayName}</b></div>
      </header>

      <section className="source-health-heading">
        <div>
          <p>READ-ONLY FOUNDATION · PHASE 1</p>
          <h1>Source<br />Health</h1>
        </div>
        <p>
          Market values are only as trustworthy as their evidence. This page shows what is
          actually connected, when it last updated, and which sources are manual or blocked.
        </p>
      </section>

      <section className="source-health-scoreboard" aria-label="Source health summary">
        <article><small>Canonical SKUs</small><b>{summary.uniqueInventorySkus.toLocaleString()}</b><span>File-backed inventory remains authoritative</span></article>
        <article><small>Active listings</small><b>{summary.activeListings.toLocaleString()}</b><span>{summary.activeListingsMissingSku} missing SKU</span></article>
        <article><small>Connected feeds</small><b>{summary.connected}</b><span>{summary.attention} require manual work or access</span></article>
        <article className="is-warning"><small>Realized comps</small><b>{summary.realizedMarketComps}</b><span>High-confidence pricing stays locked</span></article>
      </section>

      <section className="source-health-notice">
        <b>Production write lock</b>
        <span>Market intelligence is read-only. No automated repricing, publishing, deletion, buying, or offer acceptance.</span>
      </section>

      <section className="source-health-table" aria-label="Market source registry">
        <header><span>Source</span><span>Access</span><span>Last successful update</span><span>Confidence</span></header>
        {sources.map((source) => (
          <article key={source.id} className={`status-${source.status}`}>
            <div>
              <small>{source.kind}</small>
              <b>{source.name}</b>
              <p>{source.note}</p>
            </div>
            <div>
              <span className="source-status">{statusLabel(source.status)}</span>
              <small>{source.integrationType}</small>
              <small>Rate limit: {source.rateLimitStatus}</small>
            </div>
            <div>
              <b>{formatTimestamp(source.lastSuccessAt)}</b>
              <small>{formatAge(source.lastSuccessAt)}</small>
              <small>{source.detail}</small>
              {source.lastError && <small>Error: {source.lastError}</small>}
            </div>
            <div>
              <strong>{source.confidence}</strong>
              <small>{source.capabilities.length ? source.capabilities.join(" · ") : "No approved capabilities"}</small>
            </div>
          </article>
        ))}
      </section>

      <footer className="source-health-footer">
        Snapshot generated {formatTimestamp(generatedAt)} · Current app remains the inventory source of truth.
      </footer>
    </main>
  );
}
