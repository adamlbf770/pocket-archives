import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Pocket Archives — Objects Worth Holding",
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
          <h1>Objects worth<br /><em>holding.</em></h1>
        </div>
        <p>
          Pocket Archives is built around the physical side of collecting—the surface of a card,
          the weight of printed paper, and the traces left by the people who kept it before us.
        </p>
      </section>

      <section className="about-object" aria-label="A physical archive">
        <figure>
          <img
            src="/hero/pokemon-rgb-sugimori-watercolor.jpg"
            alt="Early Pokémon watercolor artwork by Ken Sugimori"
          />
        </figure>
        <div>
          <small>01 · The physical archive</small>
          <h2>A scan shows the image. The object tells the rest.</h2>
          <p>
            Scale, texture, printing, edges, wear, and provenance all belong to the story. We care
            about what an item looks like, but also how it was made, circulated, traded, and kept.
          </p>
        </div>
      </section>

      <section className="about-principles" aria-label="What guides Pocket Archives">
        <article>
          <span>02</span>
          <h2>Trading keeps collections alive.</h2>
          <p>
            A collection should move. Trading connects people, changes what a collection means,
            and gives overlooked pieces another life.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Curation over volume.</h2>
          <p>
            More is not always better. We group pieces by artist, character, era, printing history,
            or a shared visual idea—then let the connection do the talking.
          </p>
        </article>
        <article>
          <span>04</span>
          <h2>The art comes first.</h2>
          <p>
            Cards, postcards, inserts, and other ephemera are small-format works of art. The image,
            paper, typography, and production choices are why they remain worth revisiting.
          </p>
        </article>
      </section>

      <section className="about-statement">
        <p>Collected carefully.<br />Traded honestly.<br /><em>Kept with purpose.</em></p>
      </section>

      <section className="about-next">
        <p>Start with what interests you.</p>
        <div>
          <a href="/#cards">Browse cards →</a>
          <a href="/#collections">Explore collections →</a>
        </div>
      </section>

      <footer className="landing-footer">
        <div><b>Pocket Archives LLC</b><span>Independent collectibles shop</span></div>
        <p>Pocket Archives is an independent business. All product names, characters, and trademarks belong to their respective owners.</p>
      </footer>
    </main>
  );
}
