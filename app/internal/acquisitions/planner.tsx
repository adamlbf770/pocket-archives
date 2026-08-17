"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Target = {
  readonly id: string;
  readonly period: string;
  readonly year: string;
  readonly object: string;
  readonly why_it_matters: string;
  readonly target_usd_2026: string;
  readonly difficulty_1_5: string;
  readonly where_to_look: string;
  readonly verification_priority: string;
  readonly source_basis: string;
};

const statuses = ["Wanted", "Researching", "Located", "Negotiating", "Acquired", "Passed"];

export default function AcquisitionPlanner({ records }: { records: readonly Target[] }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [states, setStates] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("pocket-archives-acquisition-statuses");
    if (saved) setStates(JSON.parse(saved));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) =>
      (period === "all" || record.period === period) &&
      (!needle || `${record.id} ${record.object} ${record.period} ${record.year} ${record.why_it_matters}`.toLowerCase().includes(needle)),
    );
  }, [records, query, period]);

  function setStatus(id: string, value: string) {
    const next = { ...states, [id]: value };
    setStates(next);
    localStorage.setItem("pocket-archives-acquisition-statuses", JSON.stringify(next));
  }

  return (
    <main className="internal-research-shell wide">
      <header className="internal-research-header">
        <Link href="/internal">← Research tools</Link>
        <span>Local planning data · price bands are not appraisals</span>
      </header>
      <section className="internal-research-intro compact">
        <p>CANONICAL REGISTER · 100 TARGETS</p>
        <h1>Acquisition roadmap.</h1>
      </section>
      <div className="internal-filterbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search object, period, date, or story…" />
        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="all">All periods</option>
          {[...new Set(records.map((record) => record.period))].map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
        <b>{visible.length} shown</b>
      </div>
      <div className="internal-record-list">
        {visible.map((record) => (
          <details key={record.id}>
            <summary>
              <span>{record.id}</span>
              <b>{record.object}</b>
              <em>{record.year}</em>
              <strong>{record.target_usd_2026}</strong>
              <select value={states[record.id] || "Wanted"} onClick={(event) => event.stopPropagation()} onChange={(event) => setStatus(record.id, event.target.value)} aria-label={`Planning status for ${record.object}`}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </summary>
            <div className="internal-record-details">
              <p><small>Historical function</small>{record.why_it_matters}</p>
              <p><small>Where to look</small>{record.where_to_look}</p>
              <p><small>Verification priority</small>{record.verification_priority}</p>
              <p><small>Source references</small>{record.source_basis}</p>
              <p><small>Difficulty</small>{record.difficulty_1_5} / 5</p>
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
