export type InventoryStatus = "available" | "reserved" | "sold" | "not-for-sale";

export type InventoryItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  archivalNote: string;
  price: number;
  currency: "USD";
  quantity: number;
  status: InventoryStatus;
  category: "Cards" | "Carddass" | "Promos" | "Ephemera" | "Curated Collections";
  tags: string[];
  pokemonIds: number[];
  pokemonNames: string[];
  artist: string | null;
  year: number | null;
  set: string | null;
  number: string | null;
  language: string;
  country: string;
  manufacturer: string | null;
  condition: string;
  provenance: string | null;
  fromArchive: boolean;
  images: string[];
  relatedMuseumIds: string[];
  relatedCardIds: string[];
  collectionIds: string[];
  featured: boolean;
  demo: true;
};

export type CuratedCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  archivalNote: string;
  inventoryIds: string[];
  saleMode: "group" | "individual" | "editorial";
  price: number | null;
  currency: "USD";
  demo: true;
};

// DEMO INVENTORY — remove or replace this single array before live commerce launches.
// Images are archival stand-ins from the existing Pocket Archives library, not product photographs.
export const demoInventory: InventoryItem[] = [
  {
    id: "DEMO-001",
    slug: "demo-1997-japanese-carddass-tangela",
    title: "1997 Japanese Carddass Tangela",
    description: "A demonstration listing for a Japanese Carddass-era character piece featuring Tangela. Final listings will use photographs of the actual object offered.",
    archivalNote: "Carddass helped give the original 151 a life beyond the Game Boy screen, presenting Pokémon as collectible illustrations and cultural objects in their own right.",
    price: 18,
    currency: "USD",
    quantity: 1,
    status: "available",
    category: "Carddass",
    tags: ["New Acquisitions", "Vintage Japanese", "Sugimori", "From the Archive"],
    pokemonIds: [114],
    pokemonNames: ["Tangela"],
    artist: "Ken Sugimori",
    year: 1997,
    set: "Carddass demonstration record",
    number: "DEMO",
    language: "Japanese",
    country: "Japan",
    manufacturer: "Bandai",
    condition: "Demo condition — replace with object-specific grading notes",
    provenance: "Demonstration record; no physical object is represented.",
    fromArchive: true,
    images: ["/art/0311.webp", "/art/0457.webp"],
    relatedMuseumIds: ["pokemon-in-motion"],
    relatedCardIds: [],
    collectionIds: ["early-japanese-carddass"],
    featured: true,
    demo: true,
  },
  {
    id: "DEMO-002",
    slug: "demo-sugimori-haunter-japanese-card",
    title: "Sugimori Haunter Japanese Card",
    description: "A demonstration inventory record for an early Japanese card centered on Ken Sugimori’s Haunter artwork.",
    archivalNote: "The restrained palette and graphic silhouette show how Sugimori’s character art translated from game documentation into small-format collecting objects.",
    price: 32,
    currency: "USD",
    quantity: 1,
    status: "reserved",
    category: "Cards",
    tags: ["Sugimori", "Vintage Japanese", "Cards"],
    pokemonIds: [93],
    pokemonNames: ["Haunter"],
    artist: "Ken Sugimori",
    year: 1997,
    set: "Japanese card demonstration record",
    number: "DEMO",
    language: "Japanese",
    country: "Japan",
    manufacturer: "Demo publisher — replace with live object data",
    condition: "Demo condition — replace with object-specific grading notes",
    provenance: "Demonstration record; no physical object is represented.",
    fromArchive: false,
    images: ["/art/0290.webp", "/art/0436.webp"],
    relatedMuseumIds: ["public-visual-identity"],
    relatedCardIds: [],
    collectionIds: ["gastly-evolution-line"],
    featured: true,
    demo: true,
  },
  {
    id: "DEMO-003",
    slug: "demo-vintage-pikachu-promotional-ephemera",
    title: "Vintage Pikachu Promotional Ephemera",
    description: "A demonstration archival record for a small Japanese promotional paper object featuring Pikachu.",
    archivalNote: "Disposable paper material often preserves how Pokémon was presented in everyday life more directly than premium collectibles do.",
    price: 28,
    currency: "USD",
    quantity: 0,
    status: "sold",
    category: "Ephemera",
    tags: ["Promos", "Ephemera", "Vintage Japanese", "From the Archive"],
    pokemonIds: [25],
    pokemonNames: ["Pikachu"],
    artist: null,
    year: 1998,
    set: "Promotional ephemera demonstration record",
    number: null,
    language: "Japanese",
    country: "Japan",
    manufacturer: "Demo publisher — replace with live object data",
    condition: "Demo condition — archived after sale",
    provenance: "Demonstration record; no physical object is represented.",
    fromArchive: true,
    images: ["/art/0016.webp"],
    relatedMuseumIds: ["keeping-consistency"],
    relatedCardIds: [],
    collectionIds: [],
    featured: false,
    demo: true,
  },
  {
    id: "DEMO-004",
    slug: "demo-original-starter-evolution-lines",
    title: "Original Starter Evolution Lines",
    description: "A demonstration grouped listing built to test how a curated multi-object collection could be presented and eventually sold together or piece by piece.",
    archivalNote: "Bulbasaur, Charmander, and Squirtle arrived relatively late in the original internal sequence, yet became the carefully balanced introduction to the entire Pokémon world.",
    price: 72,
    currency: "USD",
    quantity: 1,
    status: "available",
    category: "Curated Collections",
    tags: ["Curated Collections", "Kanto", "Sugimori"],
    pokemonIds: [1, 4, 7],
    pokemonNames: ["Bulbasaur", "Charmander", "Squirtle"],
    artist: "Ken Sugimori",
    year: 1996,
    set: "Editorial demonstration grouping",
    number: null,
    language: "Japanese",
    country: "Japan",
    manufacturer: "Mixed objects — record per item",
    condition: "Demo condition — individual object notes would appear here",
    provenance: "Demonstration record; no physical objects are represented.",
    fromArchive: false,
    images: ["/art/0348.webp", "/art/0351.webp", "/art/0354.webp"],
    relatedMuseumIds: ["public-visual-identity"],
    relatedCardIds: [],
    collectionIds: ["original-starters"],
    featured: true,
    demo: true,
  },
];

// DEMO CURATED COLLECTIONS — independent from inventory so a group can remain editorial,
// become a single sellable set, or point to separately available objects later.
export const demoCuratedCollections: CuratedCollection[] = [
  {
    id: "DEMO-COLLECTION-001",
    slug: "gastly-haunter-gengar",
    title: "The Gastly / Haunter / Gengar Collection",
    description: "An editorial grouping for objects that trace one of Kanto’s most visually coherent evolution lines.",
    archivalNote: "A future collection can mix cards, print ephemera, production references, and separately priced inventory without losing the historical relationship between them.",
    inventoryIds: ["DEMO-002"],
    saleMode: "individual",
    price: null,
    currency: "USD",
    demo: true,
  },
  {
    id: "DEMO-COLLECTION-002",
    slug: "original-starters",
    title: "Original Starter Evolution Lines",
    description: "A demonstration collection joining the three original partners through a single editorial idea.",
    archivalNote: "This grouping is configured as one sellable set while retaining object-level metadata for a future inventory backend.",
    inventoryIds: ["DEMO-004"],
    saleMode: "group",
    price: 72,
    currency: "USD",
    demo: true,
  },
];

export const inventoryCollectionOptions = [
  "New Acquisitions",
  "From the Archive",
  "Sugimori",
  "Vintage Japanese",
  "Carddass",
  "Promos",
  "Cards",
  "Ephemera",
  "Curated Collections",
] as const;

export function inventoryBySlug(slug: string) {
  return demoInventory.find((item) => item.slug === slug);
}

export function inventoryForPokemon(pokemonId: number) {
  return demoInventory.filter((item) => item.pokemonIds.includes(pokemonId));
}

export function inventoryForMuseum(museumId: string) {
  return demoInventory.filter((item) => item.relatedMuseumIds.includes(museumId));
}

export function statusLabel(status: InventoryStatus) {
  if (status === "sold") return "Sold — Archived";
  if (status === "not-for-sale") return "Archive only";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}
