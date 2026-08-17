import Link from "next/link";

export default function InternalResearchHome() {
  return (
    <main className="internal-research-shell">
      <header className="internal-research-header">
        <Link href="/">← Archive</Link>
        <span>Local research workspace · not published</span>
      </header>
      <section className="internal-research-intro">
        <p>POCKET ARCHIVES · INTERNAL</p>
        <h1>Research workspace.</h1>
        <p>
          Planning tools generated from the canonical research package. These
          routes exist in local development only and are excluded from the
          public site.
        </p>
      </section>
      <nav className="internal-tool-grid">
        <Link href="/internal/acquisitions">
          <small>100 targets</small>
          <b>Acquisition roadmap</b>
          <span>Historical function, priority, planning range, and sourcing state.</span>
        </Link>
        <Link href="/internal/cgc">
          <small>813 certificates</small>
          <b>CGC investigation register</b>
          <span>Search the official affected list without changing its stated status.</span>
        </Link>
      </nav>
    </main>
  );
}
