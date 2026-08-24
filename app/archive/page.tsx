import { redirect } from "next/navigation";

const chapters = [
  {
    id: "pokemon",
    number: "01",
    years: "1990–present",
    title: "Pokémon",
    subtitle: "From field-guide watercolors to a global illustration archive.",
    image: "/hero/pokemon-rgb-sugimori-watercolor.jpg",
    imageAlt:
      "Early Pokémon watercolor artwork featuring Red, Blue, Pikachu, and Charizard",
    caption: "Early Red, Green & Blue-era watercolor · Ken Sugimori",
    museumHref: "/archive/pokemon",
    introduction:
      "Pokémon’s earliest visual identity was unusually intimate: compact creature drawings, restrained color, and the feeling of a naturalist’s notebook. As the card game expanded, that single visual language became a platform for hundreds of artists and an extraordinary range of materials.",
    moments: [
      {
        year: "1990–1995",
        title: "Designing a believable ecosystem",
        copy: "The Capsule Monsters proposal and early development drawings treated the creatures as inhabitants of a shared world. Silhouettes, scale, habitat, and evolution mattered as much as personality.",
      },
      {
        year: "1996",
        title: "The watercolor identity",
        copy: "Ken Sugimori’s ink-and-watercolor character art gave the original roster its public face. Soft washes and visible drawing lines made even strange creatures feel observed rather than manufactured.",
      },
      {
        year: "1996–2000s",
        title: "The card becomes a gallery",
        copy: "The trading card game widened the authorship of Pokémon. Artists such as Mitsuhiro Arita, Tomokazu Komiya, Kagemaru Himeno, and Yuka Morii introduced painting, graphic distortion, miniature sculpture, photography, and collage.",
      },
      {
        year: "2007–present",
        title: "A visual language that keeps moving",
        copy: "Sugimori’s manga work shows the same designs operating in sequence and motion. Later cards pushed further into full-art compositions, experimental textures, and artist-led interpretations while retaining the clarity of the original characters.",
      },
    ],
    note:
      "Pocket Archives studies Pokémon art through development material, printed ephemera, manga, production references, and cards—not only through rarity or market value.",
  },
  {
    id: "magic",
    number: "02",
    years: "1993–present",
    title: "Magic: The Gathering",
    subtitle: "Small paintings that built an enormous fantasy world.",
    image: "/hero/mtg-shivan-dragon-alpha.jpg",
    imageAlt: "Shivan Dragon artwork by Melissa A. Benson",
    caption: "Shivan Dragon · Melissa A. Benson · 1993",
    museumHref: null,
    introduction:
      "Magic arrived with a different proposition: every card was a fragment of a larger fantasy world. The earliest sets translated original paintings into a very small frame, giving the game the character of a portable illustrated book assembled differently by every player.",
    moments: [
      {
        year: "1993",
        title: "A new canvas",
        copy: "Limited Edition Alpha paired game mechanics with commissioned fantasy illustration. The art did not merely decorate the rules; it established mood, place, creature, and narrative in a single glance.",
      },
      {
        year: "Early 1990s",
        title: "Many hands, one world",
        copy: "The variety of the first artists became part of Magic’s identity. Melissa A. Benson, Christopher Rush, Quinton Hoover, Anson Maddocks, and others brought visibly distinct approaches rather than a single house style.",
      },
      {
        year: "1997–2003",
        title: "Worldbuilding becomes systematic",
        copy: "As blocks and settings grew more cohesive, illustration carried more continuity across architecture, costume, landscape, and recurring characters. A card set could now read like a coordinated visual culture.",
      },
      {
        year: "Today",
        title: "An expanding visual canon",
        copy: "Traditional painting, digital illustration, alternate treatments, and guest-artist projects now coexist. The archive’s interest is in how those methods change the emotional and material character of the card itself.",
      },
    ],
    note:
      "The Magic chapter will grow around artist lineages, original set aesthetics, printing context, and the relationship between physical paintings and their card-sized reproductions.",
  },
  {
    id: "more",
    number: "03",
    years: "1990s–present",
    title: "Sorcery & other traditions",
    subtitle: "Hand-painted fantasy, regional experiments, and what comes next.",
    image: "/hero/sorcery-melissa-benson.jpg",
    imageAlt: "Traditional fantasy artwork presented by Sorcery: Contested Realm",
    caption: "Traditional fantasy art · Melissa A. Benson · Sorcery",
    museumHref: null,
    introduction:
      "Trading-card art is not one linear history. Japanese card games, Western fantasy games, promotional cards, stickers, postcards, and recent independent systems each make different choices about scale, printing, authorship, and the value of the original artwork.",
    moments: [
      {
        year: "1990s–2000s",
        title: "Parallel visual cultures",
        copy: "Pokémon and Magic became global reference points, but they were never alone. Carddass, Digimon, Yu-Gi-Oh!, and regional promotional material developed their own relationships between animation, comics, games, and collectible print.",
      },
      {
        year: "2023",
        title: "Sorcery returns to the painted object",
        copy: "Sorcery: Contested Realm built its identity around traditional fantasy illustration and the visible hand of the artist. Its cards reconnect contemporary play with the material atmosphere of early painted card art.",
      },
      {
        year: "Now",
        title: "An archive designed to expand",
        copy: "Future chapters will follow the artwork rather than force every game into the same template: artist studies, regional print histories, unusual formats, production artifacts, and overlooked collectible ephemera.",
      },
    ],
    note:
      "This chapter is intentionally open-ended. New subjects will be added only when Pocket Archives has meaningful objects, images, or research to contribute.",
  },
];

export default function ArchivePage() {
  redirect("/");
  return (
    <main className="art-history-page">
      <header className="archive-public-header">
        <a className="brand" href="/" aria-label="Pocket Archives home">
          <span className="brand-mark">
            <img src="/pocket-archives-logo.png" alt="" />
          </span>
          <span>
            POCKET
            <br />
            ARCHIVES
            <small>Independent collector-led archive</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a>
          <a className="active" href="/archive" aria-current="page">
            Archive
          </a>
          <a className="archive-shop-link" href={EXTERNAL_SHOP_URL}>
            Shop <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="art-history-hero">
        <div>
          <p className="eyebrow">
            <span /> The art behind the cards
          </p>
          <h1>
            A history
            <br />
            <em>you can hold.</em>
          </h1>
        </div>
        <div className="art-history-intro">
          <p>
            Trading cards compress entire worlds into a few square inches. This
            archive follows the artists, materials, and visual ideas that made
            those worlds memorable.
          </p>
          <span>Open a chapter and move through the story.</span>
        </div>
      </section>

      <section className="archive-chapters" aria-labelledby="archive-chapters-title">
        <div className="archive-chapters-heading">
          <p id="archive-chapters-title">Archive chapters</p>
          <span>Three traditions · expanding over time</span>
        </div>

        {chapters.map((chapter, index) => (
          <details
            className={`archive-chapter archive-chapter-${chapter.id}`}
            key={chapter.id}
            id={chapter.id}
            open={index === 0}
          >
            <summary>
              <span className="archive-chapter-number">{chapter.number}</span>
              <span className="archive-chapter-title">
                <small>{chapter.years}</small>
                <b>{chapter.title}</b>
                <em>{chapter.subtitle}</em>
              </span>
              <span className="archive-chapter-toggle" aria-hidden="true">
                <i />
                <i />
              </span>
            </summary>

            <div className="archive-chapter-body">
              <figure>
                <img src={chapter.image} alt={chapter.imageAlt} loading="lazy" />
                <figcaption>{chapter.caption}</figcaption>
              </figure>

              <div className="archive-chapter-story">
                {chapter.museumHref && (
                  <a className="pokemon-history-entry" href={chapter.museumHref}>
                    <span>
                      <small>The complete historical archive</small>
                      <b>Walk through the history of Pokémon</b>
                      <em>
                        The original research, chronological exhibition,
                        development drawings, sketches, production sheets, and
                        sprite history are all preserved here.
                      </em>
                    </span>
                    <strong>Enter →</strong>
                  </a>
                )}
                <p className="archive-chapter-introduction">
                  {chapter.introduction}
                </p>
                <ol>
                  {chapter.moments.map((moment) => (
                    <li key={`${chapter.id}-${moment.year}-${moment.title}`}>
                      <time>{moment.year}</time>
                      <div>
                        <h2>{moment.title}</h2>
                        <p>{moment.copy}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <aside>
                  <small>Archive direction</small>
                  <p>{chapter.note}</p>
                </aside>
              </div>
            </div>
          </details>
        ))}
      </section>

      <section className="archive-method">
        <p className="eyebrow">
          <span /> How this archive works
        </p>
        <div>
          <h2>Art first. Context always.</h2>
          <p>
            Pocket Archives connects cards to the drawings, paintings,
            production methods, artists, and publishing histories behind them.
            Dates and attributions are revised as better evidence becomes
            available.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <b>Pocket Archives LLC</b>
          <span>Independent collector-led shop and archive</span>
        </div>
        <p>
          Pocket Archives is an independent business. All product names,
          characters, artwork, and trademarks belong to their respective
          owners.
        </p>
      </footer>
    </main>
  );
}
