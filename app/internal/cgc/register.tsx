"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Certificate = {
  readonly certification_number: string;
  readonly official_status: string;
  readonly source: string;
  readonly last_checked: string;
  readonly notes: string;
};

export default function CgcRegister({ records }: { records: readonly Certificate[] }) {
  const [query, setQuery] = useState("");
  const [tracked, setTracked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("pocket-archives-cgc-tracking");
    if (saved) setTracked(JSON.parse(saved));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => !needle || record.certification_number.toLowerCase().includes(needle));
  }, [records, query]);

  function toggle(certificationNumber: string) {
    const next = { ...tracked, [certificationNumber]: !tracked[certificationNumber] };
    setTracked(next);
    localStorage.setItem("pocket-archives-cgc-tracking", JSON.stringify(next));
  }

  return (
    <main className="internal-research-shell wide">
      <header className="internal-research-header">
        <Link href="/internal">← Research tools</Link>
        <span>Official status preserved verbatim</span>
      </header>
      <section className="internal-research-intro compact">
        <p>CGC NOTICE · CHECKED 16 AUGUST 2026</p>
        <h1>Prototype investigation.</h1>
        <p>Inclusion means eligible for holder review while CGC’s investigation is pending. It does not mean every listed card has been publicly determined fake.</p>
      </section>
      <div className="internal-filterbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a certification number…" inputMode="numeric" />
        <b>{visible.length} certificates</b>
      </div>
      <div className="certificate-register">
        {visible.slice(0, query ? 813 : 100).map((record) => (
          <article key={record.certification_number}>
            <b>{record.certification_number}</b>
            <span>{record.official_status}</span>
            <button className={tracked[record.certification_number] ? "active" : ""} onClick={() => toggle(record.certification_number)}>{tracked[record.certification_number] ? "Tracking" : "Track"}</button>
          </article>
        ))}
      </div>
      {!query && <p className="internal-limit-note">Showing the first 100. Search to inspect the complete 813-certificate register.</p>}
    </main>
  );
}
