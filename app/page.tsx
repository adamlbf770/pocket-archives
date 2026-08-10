"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PokemonArt = {
  id: string; title: string; dex: number | null; generation: number | null;
  category: "generation" | "alternate" | "design"; collection: string; src: string;
};

type PokemonGroup = {
  key: string; dex: number | null; title: string; generation: number;
  representative: PokemonArt; items: PokemonArt[];
};

type PokemonDetails = {
  genus: string; description: string; types: string[]; height: number;
  weight: number; habitat: string | null; legendary: boolean; mythical: boolean;
};

type TcgCard = {
  id: string; name: string; artist?: string; rarity?: string; number: string;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
};

type SetteiGroup = {
  dex: number; name: string; links: { label: string; url: string }[];
};

type ReferenceSelection = { group: SetteiGroup; index: number };

type DevelopmentItem = {
  id: string; year: number; title: string; kind: string; src: string;
  credit: string; sourceUrl: string; sourceLabel: string; description: string;
};

const developmentArchive: DevelopmentItem[] = [
  { id: "capumon-map", year: 1990, title: "Capsule Monsters world study", kind: "Original concept document", src: "https://helixchamber.com/wp-content/uploads/2018/09/1990_Capsule_Monsters_00_map_reg.png", credit: "Satoshi Tajiri & Ken Sugimori / Game Freak", sourceUrl: "https://helixchamber.com/2018/09/10/pack-monsters-world/", sourceLabel: "Helix Chamber research archive", description: "An early map and world-building study from the Capsule Monsters pitch period, before the Pokémon name was finalized." },
  { id: "capumon-catalog", year: 1990, title: "Capsule Monsters creature catalog", kind: "Prototype sprite compilation", src: "https://helixchamber.com/wp-content/uploads/2018/12/CAPUMON_SPRITESHEET2_final.png", credit: "Game Freak source assets / Helix Chamber assembly", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A research plate assembling early creature assets associated with the Capsule Monsters and early Red/Green development period." },
  { id: "capumon-sprites", year: 1990, title: "Early Capumon sprite plate", kind: "Prototype sprite compilation", src: "https://helixchamber.com/wp-content/uploads/2018/08/Capumon_sprites_clean_xsmall_propo-250x300.jpg", credit: "Game Freak source assets / Helix Chamber assembly", sourceUrl: "https://helixchamber.com/2018/08/11/index-list/", sourceLabel: "Helix Chamber research archive", description: "A proportional overview of early monster sprites, including designs that changed substantially or were removed before release." },
  { id: "early-kanto-1", year: 1995, title: "Early Kanto prototype index I", kind: "Extracted prototype assets", src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto.png", credit: "Game Freak prototype data / Helix Chamber documentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "Documented early Red/Green assets and surviving back sprites. These are game-development artifacts, not finished Sugimori illustrations." },
  { id: "early-kanto-2", year: 1995, title: "Early Kanto prototype index II", kind: "Extracted prototype assets", src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto_2.png", credit: "Game Freak prototype data / Helix Chamber documentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "The second documented plate of early Kanto-era prototype material, including cut and revised creature designs." },
  { id: "prototype-periods", year: 1995, title: "Red & Green development timeline", kind: "Research chronology", src: "https://helixchamber.com/wp-content/uploads/2019/02/periodization201902.png", credit: "Helix Chamber research presentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A visual chronology used to distinguish different periods of the long Red/Green development process." },
  { id: "map-comparison", year: 1995, title: "Early map document comparison", kind: "Development-document comparison", src: "https://helixchamber.com/wp-content/uploads/2019/02/MapPageCompare.png", credit: "Game Freak source material / Helix Chamber comparison", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A comparison of surviving early planning material used to establish the order of Red/Green development assets." },
  { id: "zukan-comparison", year: 1995, title: "Early monster index comparison", kind: "Development-document comparison", src: "https://helixchamber.com/wp-content/uploads/2019/02/ZukanCompare.png", credit: "Game Freak source material / Helix Chamber comparison", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A comparison plate connecting prototype monster-index evidence with later documented material." },
];

const referenceResources = [
  { title: "Pokémon settei directory", eyebrow: "402 Pokémon", description: "The complete PS Art Room index of official production model sheets, expressions, poses, movement cycles, and alternate forms.", url: "https://psartroom.weebly.com/setteis.html", keywords: "pokemon settei model sheets sketches poses expressions walk run cycles" },
  { title: "General references", eyebrow: "Poses & motion", description: "Human pose tools, animal movement studies, drawing references, and file-format guidance collected for artists.", url: "https://psartroom.weebly.com/references.html", keywords: "references posemaniacs animals bat cat deer dog dragon horse wolf motion" },
  { title: "Color tools", eyebrow: "Palette lab", description: "A compact collection of palette, contrast, color-scheme, and accessibility tools for building stronger artwork.", url: "https://psartroom.weebly.com/color-tools.html", keywords: "color palette contrast scheme tools" },
  { title: "Digital art tutorials", eyebrow: "Technique", description: "Tutorial links covering digital painting, linework, shading, backgrounds, animation, and workflow.", url: "https://psartroom.weebly.com/digital-art-tutorials.html", keywords: "digital art tutorials painting linework shading background animation" },
  { title: "Traditional art tutorials", eyebrow: "Paper & paint", description: "Traditional drawing and painting lessons gathered by the PS Art Room community.", url: "https://psartroom.weebly.com/art-tutorials.html", keywords: "traditional art tutorials drawing painting paper" },
  { title: "Art programs", eyebrow: "Creative tools", description: "A guide to free and paid programs for illustration, animation, pixel art, and image editing.", url: "https://psartroom.weebly.com/art-programs.html", keywords: "art programs software illustration animation pixel editing" },
];

const PAGE_SIZE = 72;
const secureReferenceHosts = new Set(["psartroom.weebly.com", "i.imgur.com", "31.media.tumblr.com", "37.media.tumblr.com", "38.media.tumblr.com", "33.media.tumblr.com", "25.media.tumblr.com", "24.media.tumblr.com", "i288.photobucket.com", "i19.photobucket.com", "i6.photobucket.com", "i5.photobucket.com", "i68.photobucket.com", "img.photobucket.com", "smg.photobucket.com", "rubberslug.s3.amazonaws.com", "ic.pics.livejournal.com", "www.pokewiki.de", "thesunnyclearing.weebly.com", "caffwin.weebly.com", "spiritofmetal.weebly.com", "lilycove.weebly.com", "olivine.weebly.com", "pikapalace.weebly.com", "bulbapedia.bulbagarden.net", "sketchfab.com", "www.google.com"]);
const generationRoman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const generationRegions = ["Special collections", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar & Hisui", "Paldea"];
const dexGenerationEnds = [151, 251, 386, 493, 649, 721, 809, 905, 1025];

function generationFor(item: PokemonArt) {
  if (item.generation) return item.generation;
  if (!item.dex) return 0;
  const index = dexGenerationEnds.findIndex((end) => item.dex! <= end);
  return index < 0 ? 9 : index + 1;
}

function groupKey(item: PokemonArt) {
  return item.dex ? `dex-${item.dex}` : `special-${item.title.toLowerCase()}`;
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function referenceDestination(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && secureReferenceHosts.has(url.hostname)) url.protocol = "https:";
    return url.toString();
  } catch {
    return value;
  }
}

function referenceProvenance(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const archived = host === "web.archive.org" || value.includes("web.archive.org/web/");
    const labels: Record<string, string> = {
      "psartroom.weebly.com": "PS Art Room mirror",
      "settei.net": "Settei.net scan archive",
      "i.imgur.com": "Imgur community mirror",
      "imgur.com": "Imgur community mirror",
      "rubberslug.s3.amazonaws.com": "Rubberslug collector archive",
      "rubberslug.com": "Rubberslug collector archive",
      "bulbapedia.bulbagarden.net": "Bulbapedia archive",
      "archives.bulbagarden.net": "Bulbagarden Archives",
      "web.archive.org": "Internet Archive preserved copy",
    };
    const label = labels[host] || (host.includes("tumblr.com") ? "Tumblr community mirror" : host.includes("photobucket.com") ? "Photobucket community mirror" : host.includes("weebly.com") ? "Community reference archive" : host);
    return { label, host, archived };
  } catch {
    return { label: "Source recorded by PS Art Room", host: "Unknown host", archived: false };
  }
}

export default function Home() {
  const [art, setArt] = useState<PokemonArt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dex");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PokemonArt | null>(null);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [variantView, setVariantView] = useState<"forms" | "artwork" | "design" | "cards">("forms");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TcgCard | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<"gallery" | "references" | "favorites">("references");
  const [setteiDirectory, setSetteiDirectory] = useState<SetteiGroup[]>([]);
  const [selectedReference, setSelectedReference] = useState<ReferenceSelection | null>(null);
  const [selectedDevelopment, setSelectedDevelopment] = useState<DevelopmentItem | null>(null);
  const [referenceImageError, setReferenceImageError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/data/pokemon.json").then((response) => response.json()).then(setArt);
    fetch("/data/settei-links.json").then((response) => response.json()).then(setSetteiDirectory);
    const saved = localStorage.getItem("pocket-archive-favorite-species");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
    const savedDisplay = localStorage.getItem("pocket-archive-display");
    if (savedDisplay === "list") setDisplayMode("list");
  }, []);

  useEffect(() => {
    const syncPageFromHash = () => {
      const generationMatch = window.location.hash.match(/^#gen-([1-9])$/);
      if (generationMatch) {
        setView("gallery");
        setFilter(`gen-${generationMatch[1]}`);
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#references" || window.location.hash === "#archive") {
        setView("references");
        setFilter("all");
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#collection" || window.location.hash === "#pokedex") {
        setView("gallery");
        setFilter("all");
      }
    };
    syncPageFromHash();
    window.addEventListener("hashchange", syncPageFromHash);
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PokemonArt[]>();
    art.forEach((item) => {
      const key = groupKey(item);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return [...map.entries()].map(([key, items]) => {
      const ordered = [...items].sort((a, b) => {
        const aCore = a.category === "generation" && a.collection.startsWith("Generation") ? 0 : 1;
        const bCore = b.category === "generation" && b.collection.startsWith("Generation") ? 0 : 1;
        return aCore - bCore || a.title.length - b.title.length || a.title.localeCompare(b.title);
      });
      const representative = ordered[0];
      return { key, dex: representative.dex, title: representative.title, generation: generationFor(representative), representative, items: ordered };
    });
  }, [art]);

  const groupMap = useMemo(() => new Map(groups.map((group) => [group.key, group])), [groups]);
  const selectedGroup = selected ? groupMap.get(groupKey(selected)) || null : null;
  const selectedForms = selectedGroup?.items.filter((item) => item.category === "generation") || [];
  const selectedArtwork = selectedGroup?.items.filter((item) => item.category === "alternate") || [];
  const selectedDesign = selectedGroup?.items.filter((item) => item.category === "design") || [];
  const shownVariants = variantView === "forms" ? selectedForms : variantView === "design" ? selectedDesign : selectedArtwork;

  useEffect(() => {
    if (!selectedGroup) return;
    setVariantView(selected?.category === "design" ? "design" : selected?.category === "alternate" ? "artwork" : selectedGroup.items.some((item) => item.category === "generation") ? "forms" : "artwork");
    setCards([]);
    setSelectedCard(null);
    setCardsError(false);
  }, [selectedGroup?.key]);

  useEffect(() => {
    if (variantView !== "cards" || !selectedGroup?.dex || cards.length || cardsLoading) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: `nationalPokedexNumbers:${selectedGroup.dex}`,
      pageSize: "250",
      orderBy: "-set.releaseDate,number",
      select: "id,name,artist,rarity,number,set,images",
    });
    setCardsLoading(true);
    setCardsError(false);
    fetch(`https://api.pokemontcg.io/v2/cards?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Card lookup failed"); return response.json(); })
      .then((payload) => { setCards(payload.data || []); setSelectedCard(payload.data?.[0] || null); })
      .catch((error) => { if (error.name !== "AbortError") setCardsError(true); })
      .finally(() => setCardsLoading(false));
    return () => controller.abort();
  }, [variantView, selectedGroup?.dex, cards.length]);

  useEffect(() => {
    if (!selectedGroup?.dex) { setDetails(null); return; }
    const controller = new AbortController();
    setDetailsLoading(true);
    setDetails(null);
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
    ]).then(([pokemon, species]) => {
      const englishDescriptions = species.flavor_text_entries.filter((entry: { language: { name: string } }) => entry.language.name === "en");
      const description = englishDescriptions.at(-1)?.flavor_text.replace(/[\n\f]/g, " ").replace(/\s+/g, " ") || "No Pokédex entry available.";
      const genus = species.genera.find((entry: { language: { name: string } }) => entry.language.name === "en")?.genus || "Pokémon";
      setDetails({ genus, description, types: pokemon.types.map((entry: { type: { name: string } }) => entry.type.name), height: pokemon.height / 10, weight: pokemon.weight / 10, habitat: species.habitat?.name || null, legendary: species.is_legendary, mythical: species.is_mythical });
    }).catch((error) => { if (error.name !== "AbortError") setDetails(null); }).finally(() => setDetailsLoading(false));
    return () => controller.abort();
  }, [selectedGroup?.dex]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = groups.filter((group) => {
      const filterMatch = filter === "all" ||
        (filter === "alternate" && group.items.some((item) => item.category === "alternate")) ||
        (filter.startsWith("gen-") && group.generation === Number(filter.slice(4)));
      const haystack = `${group.title} ${group.dex ?? ""} ${group.items.map((item) => `${item.title} ${item.collection}`).join(" ")}`.toLowerCase();
      return filterMatch && (!needle || haystack.includes(needle));
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "collection") return a.representative.collection.localeCompare(b.representative.collection) || a.title.localeCompare(b.title);
      return (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title);
    });
  }, [groups, query, filter, sort]);

  const favoriteResults = useMemo(() => filteredGroups.filter((group) => favorites.has(group.key)), [filteredGroups, favorites]);
  const designResults = useMemo(() => filteredGroups.filter((group) => group.items.some((item) => item.category === "design")), [filteredGroups]);
  const referenceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return setteiDirectory.filter((group) => !needle || `${group.name} ${group.dex} ${group.links.map((link) => link.label).join(" ")}`.toLowerCase().includes(needle));
  }, [query, setteiDirectory]);
  const referenceItems = useMemo(() => referenceResults.flatMap((group) => group.links.map((link, index) => ({ group, link, index }))), [referenceResults]);
  const developmentResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return developmentArchive.filter((item) => !needle || `${item.year} ${item.title} ${item.kind} ${item.credit} ${item.description} alpha beta prototype capsule monsters capumon`.toLowerCase().includes(needle));
  }, [query]);
  const resourceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return referenceResources.filter((resource) => !needle || `${resource.title} ${resource.eyebrow} ${resource.description} ${resource.keywords}`.toLowerCase().includes(needle));
  }, [query]);
  const activeGroups = view === "favorites" ? favoriteResults : filteredGroups;
  const activeGeneration = filter.startsWith("gen-") ? Number(filter.slice(4)) : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); searchRef.current?.focus(); }
      if (selectedDevelopment) {
        if (event.key === "Escape") setSelectedDevelopment(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") moveDevelopment(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (selectedReference) {
        if (event.key === "Escape") setSelectedReference(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          const current = referenceItems.findIndex((item) => item.group.dex === selectedReference.group.dex && item.index === selectedReference.index);
          if (current >= 0 && referenceItems.length) {
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next = referenceItems[(current + direction + referenceItems.length) % referenceItems.length];
            setSelectedReference({ group: next.group, index: next.index });
          }
        }
        return;
      }
      if (!selected || !selectedGroup) return;
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const current = activeGroups.findIndex((group) => group.key === selectedGroup.key);
        if (current >= 0 && activeGroups.length) setSelected(activeGroups[(current + direction + activeGroups.length) % activeGroups.length].representative);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const featured = useMemo(() => ["Bulbasaur", "Charizard", "Pikachu", "Gengar", "Eevee"].map((name) => art.find((item) => item.title === name && item.category === "generation")).filter(Boolean) as PokemonArt[], [art]);
  const counts = useMemo(() => ({ alternates: art.filter((item) => item.category === "alternate").length }), [art]);
  useEffect(() => setVisible(PAGE_SIZE), [query, filter, sort, view]);

  function toggleFavorite(key: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("pocket-archive-favorite-species", JSON.stringify([...next]));
      return next;
    });
  }

  function changeDisplay(mode: "grid" | "list") {
    setDisplayMode(mode);
    localStorage.setItem("pocket-archive-display", mode);
  }

  function openAllPokedex() {
    setView("gallery");
    setFilter("all");
    window.history.pushState(null, "", "#pokedex");
  }

  function openGeneration(generation: number) {
    setView("gallery");
    setFilter(`gen-${generation}`);
    window.history.pushState(null, "", `#gen-${generation}`);
  }

  function openReferences() {
    setView("references");
    setFilter("all");
    window.history.pushState(null, "", "#archive");
  }

  function openTopLevelPage(page: "archive" | "pokedex") {
    if (page === "archive") openReferences(); else openAllPokedex();
    requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }));
  }

  function openReference(group: SetteiGroup, index: number) {
    setReferenceImageError(false);
    setSelectedReference({ group, index });
  }

  function moveReference(direction: number) {
    if (!selectedReference || !referenceItems.length) return;
    const current = referenceItems.findIndex((item) => item.group.dex === selectedReference.group.dex && item.index === selectedReference.index);
    if (current < 0) return;
    const next = referenceItems[(current + direction + referenceItems.length) % referenceItems.length];
    setReferenceImageError(false);
    setSelectedReference({ group: next.group, index: next.index });
  }

  function moveDevelopment(direction: number) {
    if (!selectedDevelopment || !developmentResults.length) return;
    const current = developmentResults.findIndex((item) => item.id === selectedDevelopment.id);
    if (current < 0) return;
    setSelectedDevelopment(developmentResults[(current + direction + developmentResults.length) % developmentResults.length]);
  }

  function renderGroupCard(group: PokemonGroup) {
    const formCount = group.items.filter((item) => item.category === "generation").length;
    const artworkCount = group.items.filter((item) => item.category === "alternate").length;
    const designCount = group.items.filter((item) => item.category === "design").length;
    return (
      <article className="art-card" key={group.key}>
        <button className="image-button" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="dex-number">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <img src={group.representative.src} alt={group.title} loading="lazy" />
          <span className="view-prompt">Open Pokédex ↗</span>
          {group.items.length > 1 && <span className="forms-count">{formCount > 1 ? `${formCount} forms` : ""}{formCount > 1 && artworkCount ? " · " : ""}{artworkCount ? `${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}` : ""}{designCount ? `${formCount > 1 || artworkCount ? " · " : ""}${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}` : ""}</span>}
        </button>
        <div className="card-info">
          <div><h3>{group.title}</h3><p>{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</p></div>
          <button className={`heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
        </div>
      </article>
    );
  }

  function renderNameRow(group: PokemonGroup) {
    const formCount = group.items.filter((item) => item.category === "generation").length;
    const artworkCount = group.items.filter((item) => item.category === "alternate").length;
    const designCount = group.items.filter((item) => item.category === "design").length;
    return (
      <article className="name-row" key={group.key}>
        <button className="name-row-main" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="name-dex">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <strong>{group.title}</strong>
          <span className="name-region">{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</span>
          <span className="name-counts">{formCount > 1 ? `${formCount} forms` : "Standard form"}{artworkCount ? ` · ${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}` : ""}{designCount ? ` · ${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}` : ""}</span>
          <span className="name-arrow">↗</span>
        </button>
        <button className={`heart name-heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
      </article>
    );
  }

  function renderDesignCard(group: PokemonGroup) {
    const sheets = group.items.filter((item) => item.category === "design");
    const cover = sheets[0];
    return <article className="art-card design-card" key={`design-${group.key}`}>
      <button className="image-button" onClick={() => setSelected(cover)} aria-label={`Open sketches and design for ${group.title}`}>
        <span className="dex-number">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "REF"}</span>
        <img src={cover.src} alt={`${group.title} character design reference`} loading="lazy" />
        <span className="view-prompt">Open reference ↗</span>
        <span className="forms-count">{sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}</span>
      </button>
      <div className="card-info"><div><h3>{group.title}</h3><p>{cover.collection}</p></div><button className={`heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button></div>
    </article>;
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pocket Archives home"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></a>
        <nav aria-label="Primary navigation"><button className={view === "references" ? "active" : ""} onClick={() => openTopLevelPage("archive")}>Archive</button><button className={view === "gallery" ? "active" : ""} onClick={() => openTopLevelPage("pokedex")}>Pokédex</button></nav>
        <button className="favorites-link" onClick={() => { setView("favorites"); setFilter("all"); document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }); }}><span>♥</span> Favorites <b>{favorites.size}</b></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> The complete illustrated Pokédex</p><h1>Every era.<br /><em>Every form.</em></h1><p className="hero-intro">A fan-made field guide to 1,858 pieces of official Pokémon character art—from Kanto classics to Paldea and beyond.</p><a className="explore-button" href="#pokedex">Open the Pokédex <span>↓</span></a></div>
        <div className="hero-gallery" aria-label="Featured Pokémon artwork">{featured.map((item, index) => <button key={item.id} className={`feature-card feature-${index + 1}`} onClick={() => setSelected(item)} aria-label={`View ${item.title}`}><span className="feature-number">{String(item.dex).padStart(4, "0")}</span><img src={item.src} alt={item.title} /></button>)}{!featured.length && <div className="hero-loader">Cataloguing<br />the archive…</div>}</div>
        <div className="hero-stats"><span><b>{art.length ? art.length.toLocaleString() : "—"}</b> artworks</span><span><b>{groups.filter((group) => group.dex).length || "—"}</b> Pokémon</span><span><b>{counts.alternates || "—"}</b> alternates</span></div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading"><div><p className="eyebrow"><span /> {view === "gallery" ? "Browse the Pokédex" : view === "favorites" ? "Your collection" : "Explore the archive"}</p><h2>{view === "gallery" ? "Know your favorite." : view === "favorites" ? "Saved for later." : "See how they’re made."}</h2></div><p>{view === "gallery" ? "Search a Pokémon once, then explore its Pokédex data, forms, and artwork in one place." : view === "favorites" ? "Every Pokémon you have favorited on this device, gathered in one place." : "From 1990 prototype concepts to modern production sheets—organized from oldest to newest and viewed without leaving the archive."}</p></div>
        <div className="view-tabs" role="tablist" aria-label="Collection views">
          <button role="tab" aria-selected={view === "references"} className={view === "references" ? "active" : ""} onClick={openReferences}><span>01</span> Archive</button>
          <button role="tab" aria-selected={view === "gallery"} className={view === "gallery" ? "active" : ""} onClick={openAllPokedex}><span>02</span> Pokédex</button>
        </div>

        <div className="filter-panel">
          <label className="search-box"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === "references" ? "Search Pokémon, prototype, pose, or resource…" : "Search Pokémon, number, form, or collection…"} aria-label={view === "references" ? "Search reference library" : "Search Pokédex"} /><kbd>/</kbd></label>
          {view === "gallery" ? <div className="filter-row" aria-label="Open generation page"><button className={filter === "all" ? "active" : ""} onClick={openAllPokedex}>All</button>{Array.from({ length: 9 }, (_, index) => index + 1).map((gen) => <button key={gen} className={filter === `gen-${gen}` ? "active" : ""} onClick={() => openGeneration(gen)}>Gen {generationRoman[gen]}</button>)}</div> : view === "references" ? <p className="favorites-note">Tap any sheet to study it here in the archive. Use the arrows to move through the collection without leaving the site.</p> : <p className="favorites-note">Your saved Pokémon live here on this device.</p>}
        </div>

        {view === "gallery" && activeGeneration && <div className="generation-page-heading"><div><span>Generation {generationRoman[activeGeneration]}</span><h3>{generationRegions[activeGeneration]}</h3></div><button onClick={openAllPokedex}>← All Pokémon</button></div>}

        <div className="results-bar"><p>{view === "references" ? <><b>{developmentResults.length.toLocaleString()}</b> early-development plates · <b>{designResults.length.toLocaleString()}</b> archive sketches · <b>{referenceItems.length.toLocaleString()}</b> production sheets</> : <><b>{activeGroups.length.toLocaleString()}</b> Pokémon{activeGeneration ? ` · Generation ${generationRoman[activeGeneration]}` : ""}</>}</p><div className="results-controls">{view === "gallery" && <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="dex">Pokédex number</option><option value="name">Name A–Z</option><option value="collection">Collection</option></select></label>}{view !== "references" && <div className="display-toggle" role="group" aria-label="Display style"><button className={displayMode === "grid" ? "active" : ""} onClick={() => changeDisplay("grid")} aria-pressed={displayMode === "grid"}><span>▦</span> Grid</button><button className={displayMode === "list" ? "active" : ""} onClick={() => changeDisplay("list")} aria-pressed={displayMode === "list"}><span>☰</span> Names</button></div>}</div></div>

        {view === "references" ? <div className="reference-library">
          {!!developmentResults.length && <section className="development-archive"><div className="timeline-heading"><span>1990–1995 · Earliest first</span><h3>Alpha &amp; beta archive</h3><p>Original concepts, extracted prototype assets, and research plates are labeled separately.</p></div><div className="development-grid">{developmentResults.map((item) => <article className="development-card" key={item.id}><button onClick={() => setSelectedDevelopment(item)} aria-label={`Open ${item.title}`}><span className="development-image"><img src={item.src} alt={item.title} loading="lazy" /></span><span className="development-card-copy"><small>{item.year} · {item.kind}</small><strong>{item.title}</strong><em>{item.credit}</em></span><span className="sheet-open">Open historical plate ↗</span></button></article>)}</div><div className="prototype-portals"><a href="https://helixchamber.com/2019/02/16/what-dreams-may-come/" target="_blank" rel="noreferrer"><span>1990–1995</span><b>Complete Red &amp; Green prototype research</b><small>Helix Chamber ↗</small></a><a href="https://tcrf.net/Proto:Pok%C3%A9mon_Gold_and_Silver/Spaceworld_1997_Demo/Pok%C3%A9mon" target="_blank" rel="noreferrer"><span>1997</span><b>Space World Gold &amp; Silver prototype</b><small>The Cutting Room Floor ↗</small></a></div></section>}
          <section className="archive-provenance"><div><span>About the collection</span><h3>What are these sheets?</h3></div><div><p><b>Settei</b> are production reference drawings distributed to animation staff so characters, objects, poses, and proportions remain consistent. The Pokémon animated series is primarily produced in Japan by OLM.</p><p>These scans were gathered through the <a href="https://psartroom.weebly.com/setteis.html" target="_blank" rel="noreferrer">PS Art Room index</a> from many original hosts and community mirrors. The popup for every sheet identifies that host. Individual sheet artists are listed only when a reliable credit exists; most files do not contain one.</p><p className="provenance-links"><a href="https://psartroom.weebly.com/setteis.html" target="_blank" rel="noreferrer">View curated index ↗</a><a href="https://bulbapedia.bulbagarden.net/wiki/Production_of_Pok%C3%A9mon_animation" target="_blank" rel="noreferrer">How Pokémon animation is made ↗</a></p></div></section>
          {!!designResults.length && <section className="archive-sketches"><div className="reference-heading"><span>1996–present · Pokédex order</span><h3>Character sketches</h3><p>{designResults.length} Pokémon</p></div><div className="art-grid">{designResults.map(renderDesignCard)}</div></section>}
          <div className="reference-layout"><div className="reference-main"><div className="reference-heading"><span>1997–present · Pokédex order</span><h3>Production references</h3><p>{referenceItems.length} sheets</p></div>{setteiDirectory.length === 0 ? <div className="loading-grid">Indexing the reference room…</div> : referenceItems.length === 0 ? <div className="empty-state"><span>?</span><h3>No reference sheets found</h3><p>Try another Pokémon, pose, or expression.</p><button onClick={() => setQuery("")}>Clear search</button></div> : <div className="settei-gallery">{referenceItems.slice(0, visible).map(({ group, link, index }) => { const archived = link.url.includes("web.archive.org/web/"); return <article className="sheet-card" key={`${group.dex}-${link.url}-${index}`}><button onClick={() => openReference(group, index)} aria-label={`Open ${group.name} ${link.label} in the reference viewer`}><span className="sheet-image"><img src={referenceDestination(link.url)} alt={`${group.name} ${link.label}`} loading="lazy" /></span><span className="sheet-card-copy"><small>#{String(group.dex).padStart(4, "0")}{archived ? " · Preserved copy" : " · Production art"}</small><strong>{group.name}</strong><em>{link.label === "Model sheet" && index > 0 ? `Model sheet ${index + 1}` : titleCase(link.label)}</em></span><span className="sheet-open">View full sheet ↗</span></button></article>; })}</div>}</div>
          {!!resourceResults.length && <aside className="resource-sidebar"><div className="reference-heading compact"><span>Artist toolkit</span><h3>More resources</h3></div><div className="resource-grid">{resourceResults.map((resource) => <a className="resource-card" href={resource.url} target="_blank" rel="noreferrer" key={resource.title}><span>{resource.eyebrow}</span><h3>{resource.title}</h3><p>{resource.description}</p><b>Visit original resource ↗</b></a>)}</div></aside>}</div>
        </div> : art.length === 0 ? <div className="loading-grid">Opening the archive…</div> : activeGroups.length === 0 ? <div className="empty-state"><span>{view === "favorites" ? "♥" : "?"}</span><h3>{view === "favorites" ? "No favorites yet" : "No matches found"}</h3><p>{view === "favorites" ? "Tap the heart on any Pokémon to build your collection." : "Try another name, number, or generation."}</p>{view !== "favorites" && <button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>}</div> : <div className={displayMode === "grid" ? "art-grid" : "name-list"}>{(displayMode === "grid" ? activeGroups.slice(0, visible) : activeGroups).map(displayMode === "grid" ? renderGroupCard : renderNameRow)}</div>}
        {view === "references" && visible < referenceItems.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, referenceItems.length - visible)}</span></button>}
        {displayMode === "grid" && view !== "references" && visible < activeGroups.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, activeGroups.length - visible)}</span></button>}
      </section>

      <section className="about" id="about"><p className="eyebrow"><span /> About the archive</p><div className="about-grid"><h2>A visual history,<br />one creature at a time.</h2><div><p>Pocket Archives brings each Pokémon’s official art, forms, reference drawings, cards, and Pokédex details together. Your supplied character-design sheets and PS Art Room’s credited production references share one searchable References &amp; Sketches section, while remaining visibly identified by source. Species information is supplied by PokéAPI, and the image-only card gallery is supplied by the community Pokémon TCG API.</p><p className="source-links"><a href="https://psartroom.weebly.com/" target="_blank" rel="noreferrer">PS Art Room ↗</a><a href="https://pokeapi.co/docs/v2" target="_blank" rel="noreferrer">Pokédex data ↗</a><a href="https://docs.pokemontcg.io/" target="_blank" rel="noreferrer">Card data ↗</a><a href="https://iwataasks.nintendo.com/interviews/ds/pokemon-black-white/0/1/" target="_blank" rel="noreferrer">Sugimori interview ↗</a></p><p className="fine-print">A personal, non-commercial fan archive. Pokémon and all related characters are trademarks of Nintendo, Game Freak, and Creatures Inc. External reference links remain credited to their original curators and hosts.</p></div></div></section>
      <footer><div className="brand footer-brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></div><p>Gotta archive ’em all.</p><a href="#top">Back to top ↑</a></footer>

      {selected && selectedGroup && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selectedGroup.title} Pokédex entry`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
        <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close Pokédex entry">×</button>
        <div className={`modal-art ${selectedGroup.dex || selectedGroup.items.length > 1 ? "has-forms" : ""}`}><span className="modal-index">{variantView === "cards" && selectedCard ? `${selectedCard.set.name} · #${selectedCard.number}` : selectedGroup.dex ? `#${String(selectedGroup.dex).padStart(4, "0")}` : "SPECIAL ART"}</span>{variantView === "cards" && selectedCard ? <img className="tcg-card-main" src={selectedCard.images.large} alt={`${selectedCard.name} card from ${selectedCard.set.name}`} /> : <img src={selected.src} alt={selected.title} />}{(selectedGroup.dex || selectedGroup.items.length > 1) && <div className="form-strip" aria-label={`${selectedGroup.title} images`}><div className="variant-tabs" role="tablist" aria-label="Image type"><button role="tab" aria-selected={variantView === "forms"} className={variantView === "forms" ? "active" : ""} disabled={!selectedForms.length} onClick={() => { setVariantView("forms"); if (selectedForms.length) setSelected(selectedForms[0]); }}>Forms <b>{selectedForms.length}</b></button><button role="tab" aria-selected={variantView === "artwork"} className={variantView === "artwork" ? "active" : ""} disabled={!selectedArtwork.length} onClick={() => { setVariantView("artwork"); if (selectedArtwork.length) setSelected(selectedArtwork[0]); }}>Alternate artwork <b>{selectedArtwork.length}</b></button><button role="tab" aria-selected={variantView === "design"} className={variantView === "design" ? "active" : ""} disabled={!selectedDesign.length} onClick={() => { setVariantView("design"); if (selectedDesign.length) setSelected(selectedDesign[0]); }}>Sketches & design <b>{selectedDesign.length}</b></button><button role="tab" aria-selected={variantView === "cards"} className={variantView === "cards" ? "active" : ""} disabled={!selectedGroup.dex} onClick={() => setVariantView("cards")}>Cards <b>{cardsLoading ? "…" : cards.length || ""}</b></button></div>{variantView === "cards" ? cardsLoading ? <p className="card-strip-message">Finding cards…</p> : cardsError ? <p className="card-strip-message">Card gallery unavailable right now.</p> : cards.map((card) => <button key={card.id} className={`variant-thumb card-thumb ${selectedCard?.id === card.id ? "active" : ""}`} onClick={() => setSelectedCard(card)} aria-label={`Show ${card.name}, ${card.set.name} number ${card.number}`}><img src={card.images.small} alt="" loading="lazy" /><span>{card.set.name} · {card.number}</span></button>) : shownVariants.map((item) => <button key={item.id} className={`variant-thumb ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelected(item)} aria-label={`Show ${item.title}, ${item.collection}`}><img src={item.src} alt="" loading="lazy" /><span>{item.title}</span></button>)}</div>}</div>
        <div className="modal-details"><p className="eyebrow"><span /> {selectedGroup.dex ? `Generation ${generationRoman[selectedGroup.generation]} · ${generationRegions[selectedGroup.generation]}` : selected.collection}</p><h2>{selectedGroup.title}</h2>{detailsLoading ? <p className="details-loading">Reading Pokédex data…</p> : details ? <><p className="pokemon-genus">{details.legendary ? "Legendary · " : details.mythical ? "Mythical · " : ""}{details.genus}</p><p className="dex-description">{details.description}</p><div className="type-row">{details.types.map((type) => <span className={`type type-${type}`} key={type}>{titleCase(type)}</span>)}</div><dl className="pokemon-facts"><div><dt>Height</dt><dd>{details.height} m</dd></div><div><dt>Weight</dt><dd>{details.weight} kg</dd></div><div><dt>Habitat</dt><dd>{details.habitat ? titleCase(details.habitat) : "Unknown"}</dd></div><div><dt>Artwork</dt><dd>{selectedGroup.items.length} in archive</dd></div></dl></> : selectedGroup.dex ? <p className="dex-description">Pokédex information is temporarily unavailable.</p> : <p className="dex-description">This unnumbered artwork belongs to the {selected.collection} collection.</p>}
          {variantView === "cards" && selectedCard ? <div className="source-credit card-credit"><span>Trading card</span><b>{selectedCard.set.name} · #{selectedCard.number}</b><p>{selectedCard.rarity || "Rarity not listed"} · Illustrated by {selectedCard.artist || "artist not listed"}</p></div> : <div className="source-credit"><span>Artwork source</span><b>{selected.collection}</b><p>Official Pokémon game artwork from the supplied archive. The individual illustrator is not identified in this file.</p></div>}
          <div className="modal-actions"><button onClick={() => toggleFavorite(selectedGroup.key)}>{favorites.has(selectedGroup.key) ? "♥ In favorites" : "♡ Add to favorites"}</button>{variantView === "cards" && selectedCard ? <a href={selectedCard.images.large} target="_blank" rel="noreferrer">Open card image ↗</a> : <a href={selected.src} download>Download art ↓</a>}</div><p className="key-hint">Use ← → for next Pokémon · Esc to close</p>
        </div>
      </div>}

      {selectedReference && <div className="reference-viewer" role="dialog" aria-modal="true" aria-label={`${selectedReference.group.name} reference sheet`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedReference(null); }}>
        <button className="reference-viewer-close" onClick={() => setSelectedReference(null)} aria-label="Close reference viewer">×</button>
        <div className="reference-viewer-stage">
          <span className="reference-viewer-index">#{String(selectedReference.group.dex).padStart(4, "0")} · {selectedReference.index + 1} of {selectedReference.group.links.length}</span>
          {referenceImageError ? <div className="reference-image-error"><b>Preview unavailable</b><p>This preserved sheet could not be loaded by its original host.</p></div> : <img src={referenceDestination(selectedReference.group.links[selectedReference.index].url)} alt={`${selectedReference.group.name} ${selectedReference.group.links[selectedReference.index].label}`} onError={() => setReferenceImageError(true)} />}
          <button className="reference-step previous" onClick={() => moveReference(-1)} aria-label="Previous reference sheet">←</button>
          <button className="reference-step next" onClick={() => moveReference(1)} aria-label="Next reference sheet">→</button>
        </div>
        <aside className="reference-viewer-details">
          <p className="eyebrow"><span /> Production reference</p>
          <h2>{selectedReference.group.name}</h2>
          <p className="reference-viewer-label">{titleCase(selectedReference.group.links[selectedReference.index].label)}</p>
          <p className="reference-viewer-description">Study the silhouette, proportions, expressions, poses, and construction notes without leaving Pocket Archives.</p>
          {selectedReference.group.links.length > 1 && <div className="reference-sheet-tabs" aria-label={`${selectedReference.group.name} reference sheets`}>{selectedReference.group.links.map((link, index) => <button className={index === selectedReference.index ? "active" : ""} onClick={() => { setReferenceImageError(false); setSelectedReference({ group: selectedReference.group, index }); }} key={`${link.url}-${index}`}>{index + 1}</button>)}</div>}
          <div className="reference-source"><span>Provenance</span><b>{referenceProvenance(selectedReference.group.links[selectedReference.index].url).label}</b><p>{referenceProvenance(selectedReference.group.links[selectedReference.index].url).archived ? "Preserved copy located through the PS Art Room index" : `Image host: ${referenceProvenance(selectedReference.group.links[selectedReference.index].url).host} · Located through the PS Art Room index`}</p></div>
          <div className="reference-source artist-status"><span>Artist credit</span><b>Not identified in the source file</b><p>Do not assume the game illustrator created an anime production sheet unless a reliable credit is documented.</p></div>
          <a className="reference-original" href={referenceDestination(selectedReference.group.links[selectedReference.index].url)} target="_blank" rel="noreferrer">Open original image ↗</a>
          <p className="key-hint">Use ← → for another sheet · Esc to close</p>
        </aside>
      </div>}

      {selectedDevelopment && <div className="reference-viewer development-viewer" role="dialog" aria-modal="true" aria-label={`${selectedDevelopment.title} early development plate`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedDevelopment(null); }}>
        <button className="reference-viewer-close" onClick={() => setSelectedDevelopment(null)} aria-label="Close early development viewer">×</button>
        <div className="reference-viewer-stage development-stage">
          <span className="reference-viewer-index">{selectedDevelopment.year} · {developmentResults.findIndex((item) => item.id === selectedDevelopment.id) + 1} of {developmentResults.length}</span>
          <img src={selectedDevelopment.src} alt={selectedDevelopment.title} />
          <button className="reference-step previous" onClick={() => moveDevelopment(-1)} aria-label="Previous early development plate">←</button>
          <button className="reference-step next" onClick={() => moveDevelopment(1)} aria-label="Next early development plate">→</button>
        </div>
        <aside className="reference-viewer-details">
          <p className="eyebrow"><span /> Early development archive</p>
          <h2>{selectedDevelopment.title}</h2>
          <p className="reference-viewer-label">{selectedDevelopment.year} · {selectedDevelopment.kind}</p>
          <p className="reference-viewer-description">{selectedDevelopment.description}</p>
          <div className="reference-source"><span>Creator / assembly credit</span><b>{selectedDevelopment.credit}</b><p>{selectedDevelopment.sourceLabel}</p></div>
          <div className="reference-source artist-status"><span>Classification</span><b>{selectedDevelopment.kind}</b><p>Prototype extractions and research assemblies are identified separately from original concept drawings and finished character art.</p></div>
          <a className="reference-original" href={selectedDevelopment.sourceUrl} target="_blank" rel="noreferrer">Read source research ↗</a>
          <p className="key-hint">Use ← → for another plate · Esc to close</p>
        </aside>
      </div>}
    </main>
  );
}
