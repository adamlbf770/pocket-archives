import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Pocket Archives",
  description:
    "Pocket Archives is an independent collectibles shop centered on physical objects, trading, thoughtful collections, curation, and art.",
};

function AboutHeader() {
  return (
    <header className="landing-header" id="top">
      <a className="brand" href="/" aria-label="Pocket Archives home">
        <span className="brand-mark">
          <img src="/pocket-archives-logo.png" alt="" />
        </span>
        <span>
          POCKET
          <br />
          ARCHIVES
          <small>Cards, art, and collecting history</small>
        </span>
      </a>
      <nav className="landing-desktop-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/about" aria-current="page">About</a>
        <a href="/#cards">Cards</a>
        <a href="/#collections">Collections</a>
      </nav>
      <details className="landing-mobile-menu">
        <summary aria-label="Open navigation menu">
          <span />
          <span />
          <span />
        </summary>
        <nav aria-label="Mobile navigation">
          <a href="/">Home</a>
          <a href="/about" aria-current="page">About</a>
          <a href="/#cards">Cards</a>
          <a href="/#collections">Collections</a>
        </nav>
      </details>
    </header>
  );
}

export default function AboutPage() {
  return (
    <main className="about-page">
      <AboutHeader />

      <section className="about-hero">
        <div>
          <p className="eyebrow"><span /> About Pocket Archives</p>
          <h1>Built from<br /><em>passion.</em></h1>
        </div>
        <p>Collecting is personal. Pocket Archives is too.</p>
      </section>

      <section className="about-object" aria-label="Our story">
        <figure>
          <img
            src="/hero/pokemon-rgb-sugimori-watercolor.jpg"
            alt="Early Pokémon watercolor artwork by Ken Sugimori"
          />
        </figure>
        <div>
          <small>Our story</small>
          <h2>The things we keep stay with us.</h2>
          <p>
            I started Pocket Archives out of a lifelong attachment to the objects that make
            collecting feel personal. A card is never only an image: it has weight, texture,
            edges, wear, and a history of being opened, handled, traded, and kept. That physical
            connection is what turns nostalgia into something you can actually hold.
          </p>
          <p>
            My ambition is to build a thoughtful home for that feeling—one shaped by passion
            rather than volume. Pocket Archives brings together cards, art, ephemera, and curated
            collections chosen for the stories they carry and the people they connect. Whether a
            piece is being added, traded, or passed on, I want it to feel considered, honest, and
            worth caring about.
          </p>
          <div className="about-story-actions">
            <a href="/#cards">Browse cards →</a>
            <a href="/#collections">Explore collections →</a>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div><b>Pocket Archives LLC</b><span>Independent collectibles shop</span></div>
        <p>Pocket Archives is an independent business. All product names, characters, and trademarks belong to their respective owners.</p>
      </footer>
    </main>
  );
}
