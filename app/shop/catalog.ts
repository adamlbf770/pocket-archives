export type AvailabilityStatus = "available" | "reserved" | "sold" | "not-for-sale";
export type RecordState = "collection" | "available" | "private-collection";
export type CommerceMode = "fixedPrice" | "auction" | "privateSale" | "notForSale" | "sold";
export type DownloadRights = "allowed" | "display-only" | "thumbnail-only" | "restricted" | "unknown";
export type ObjectImageView = "front" | "back" | "detail" | "edge" | "corner" | "surface" | "packaging" | "insert" | "provenance" | "placeholder";

export type ObjectImage = {
  src: string;
  caption: string;
  view: ObjectImageView;
  creator: string;
  rightsHolder: string;
  rightsStatus: DownloadRights;
  usageBasis: string;
};

export type InventoryItem = {
  accessionNumber: string;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  objectType: string;
  category: "Cards" | "Carddass" | "Promos" | "Ephemera" | "Printed Matter" | "Curated Collections";
  description: string;
  archivalNote: string;
  culturalSignificance: string;
  year: number | null;
  approximateYear: boolean;
  era: string;
  country: string;
  language: string;
  artist: string | null;
  illustrator: string | null;
  manufacturer: string | null;
  publisher: string | null;
  set: string | null;
  series: string | null;
  cardNumber: string | null;
  catalogNumber: string | null;
  edition: string | null;
  printing: string | null;
  condition: string;
  conditionNotes: string;
  dimensions: string | null;
  provenance: string;
  acquisitionSource: string | null;
  acquisitionDate: string | null;
  pokemonIds: number[];
  pokemonNames: string[];
  artistIds: string[];
  relatedMuseumIds: string[];
  relatedArchiveIds: string[];
  relatedCardIds: string[];
  relatedCollectionIds: string[];
  tags: string[];
  fromArchive: boolean;
  physicalOwnership: boolean;
  commerceMode: CommerceMode;
  recordState: RecordState;
  availabilityStatus: AvailabilityStatus;
  price: number | null;
  currency: "USD";
  quantity: number;
  reserved: boolean;
  soldDate: string | null;
  placedInPrivateCollection: boolean;
  images: ObjectImage[];
  sourceMetadata: string;
  rightsMetadata: string;
  featured: boolean;
  demo: true;
};

export type CuratedCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  curatorNote: string;
  era: string;
  featuredImage: string | null;
  inventoryIds: string[];
  pokemonIds: number[];
  relatedArchiveIds: string[];
  relatedMuseumIds: string[];
  saleMode: "group" | "individual" | "editorial";
  collectionPrice: number | null;
  currency: "USD";
  demo: true;
};

function demoCardImage(src: string, subject: string): ObjectImage {
  return {
    src,
    caption: `${subject} card scan — replace with photos of the card being sold.`,
    view: "placeholder",
    creator: "Pokémon TCG API image library",
    rightsHolder: "Pokémon rights holders",
    rightsStatus: "display-only",
    usageBasis: "Temporary sample card scan sourced through the Pokémon TCG API",
  };
}

const demoVisuals = [
  demoCardImage("/shop/cards/bulbasaur-base.png", "Bulbasaur Base Set"),
  demoCardImage("/shop/cards/haunter-fossil.png", "Haunter Fossil"),
  demoCardImage("/shop/cards/pikachu-promo.png", "Pikachu Black Star Promo"),
  demoCardImage("/shop/cards/mew-promo.png", "Mew Black Star Promo"),
  demoCardImage("/shop/cards/bulbasaur-base.png", "Original starter trio"),
];
const starterVisuals = [
  demoVisuals[0],
  demoCardImage("/shop/cards/charmander-base.png", "Charmander Base Set"),
  demoCardImage("/shop/cards/squirtle-base.png", "Squirtle Base Set"),
];
const demoPlaceholder = demoVisuals[0];

// DEMO INVENTORY — remove or replace this single array before live inventory launches.
// No record below represents a physical item currently owned or offered by Pocket Archives.
export const demoInventory: InventoryItem[] = [
  {
    accessionNumber: "PA-0001", id: "DEMO-001", slug: "demo-1997-carddass-bulbasaur", title: "Bulbasaur", subtitle: "Pocket Monsters Carddass — demonstration record", objectType: "Collectible card", category: "Carddass",
    description: "A demonstration listing showing how a 1997 Japanese Carddass card would be presented. Final listings will use photographs and condition notes for the actual piece.", archivalNote: "Carddass gave the original 151 a life beyond the Game Boy screen, presenting Pokémon as small-format collectible illustrations.", culturalSignificance: "An example of Pokémon’s early expansion into Japanese printed collecting culture.",
    year: 1997, approximateYear: false, era: "Early franchise · 1996–1999", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Bandai", publisher: "Bandai", set: "Pocket Monsters Carddass", series: "Demonstration series", cardNumber: "DEMO", catalogNumber: "PA-0001", edition: "Demo", printing: "Demo", condition: "Excellent", conditionNotes: "Demonstration condition only. Replace with front, back, edge, corner, and surface observations.", dimensions: "To be measured", provenance: "Demonstration listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [1], pokemonNames: ["Bulbasaur"], artistIds: ["ken-sugimori"], relatedMuseumIds: ["pokemon-in-motion", "public-visual-identity"], relatedArchiveIds: ["carddass-action-1"], relatedCardIds: [], relatedCollectionIds: ["early-japanese-carddass", "original-starters"], tags: ["New Acquisitions", "Sugimori", "Vintage Japanese", "Carddass"], fromArchive: true, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 18, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [demoPlaceholder], sourceMetadata: "Listing pending live inventory photography.", rightsMetadata: "Shop images must be original photographs of owned physical inventory.", featured: true, demo: true,
  },
  {
    accessionNumber: "PA-0002", id: "DEMO-002", slug: "demo-sugimori-haunter-japanese-card", title: "Haunter", subtitle: "Japanese illustrated card — demonstration record", objectType: "Trading card", category: "Cards",
    description: "A sample listing for an early Japanese card centered on Ken Sugimori’s Haunter artwork.", archivalNote: "Haunter’s restrained palette and graphic silhouette work especially well on a small card.", culturalSignificance: "A link between the card, its Pokémon, its illustrator, and the wider archive.",
    year: 1997, approximateYear: true, era: "Early franchise · 1996–1999", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: null, publisher: "Demo publisher", set: "Japanese card demonstration record", series: "Demo series", cardNumber: "DEMO", catalogNumber: "PA-0002", edition: null, printing: null, condition: "Very Good", conditionNotes: "Demonstration condition only; descriptive notes remain flexible for non-TCG collectibles.", dimensions: null, provenance: "Demonstration listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [93], pokemonNames: ["Haunter"], artistIds: ["ken-sugimori"], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: ["gastly-haunter-gengar"], tags: ["Sugimori", "Vintage Japanese", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "collection", availabilityStatus: "reserved", price: 32, currency: "USD", quantity: 1, reserved: true, soldDate: null, placedInPrivateCollection: false, images: [demoPlaceholder], sourceMetadata: "Listing pending live inventory photography.", rightsMetadata: "Shop images must be original photographs of owned physical inventory.", featured: true, demo: true,
  },
  {
    accessionNumber: "PA-0003", id: "DEMO-003", slug: "demo-vintage-pikachu-promotional-ephemera", title: "Pikachu", subtitle: "Japanese Pikachu promo — sample listing", objectType: "Promo", category: "Ephemera",
    description: "A demonstration listing for a small Japanese promotional paper piece featuring Pikachu.", archivalNote: "Disposable paper material often preserves how Pokémon was presented in everyday life more directly than premium collectibles do.", culturalSignificance: "A model for keeping a collectible’s history visible after it leaves Pocket Archives.",
    year: 1998, approximateYear: true, era: "Early franchise · 1996–1999", country: "Japan", language: "Japanese", artist: null, illustrator: null, manufacturer: null, publisher: "Demo publisher", set: null, series: "Promotional material", cardNumber: null, catalogNumber: "PA-0003", edition: null, printing: null, condition: "Good", conditionNotes: "Demonstration condition only.", dimensions: null, provenance: "Demonstration listing; no physical item or buyer is represented.", acquisitionSource: "Demo source", acquisitionDate: "2026", pokemonIds: [25], pokemonNames: ["Pikachu"], artistIds: [], relatedMuseumIds: ["keeping-consistency"], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Promos", "Ephemera", "Vintage Japanese", "From the Archive"], fromArchive: true, physicalOwnership: false, commerceMode: "fixedPrice", recordState: "private-collection", availabilityStatus: "sold", price: 28, currency: "USD", quantity: 0, reserved: false, soldDate: "Demo date", placedInPrivateCollection: true, images: [demoPlaceholder], sourceMetadata: "Demonstration listing only.", rightsMetadata: "Shop images must be original photographs of owned physical inventory.", featured: false, demo: true,
  },
  {
    accessionNumber: "PA-0004", id: "DEMO-004", slug: "demo-pocket-monsters-printed-matter", title: "Pocket Monsters Print", subtitle: "Early Japanese print — sample listing", objectType: "Print", category: "Printed Matter",
    description: "A sample listing for an early Japanese Pokémon print kept in the Pocket Archives collection.", archivalNote: "Some pieces are worth keeping even when they are not for sale.", culturalSignificance: "A place for books, magazines, flyers, inserts, and other paper pieces kept by Pocket Archives.",
    year: 1997, approximateYear: true, era: "Early franchise · 1996–1999", country: "Japan", language: "Japanese", artist: null, illustrator: null, manufacturer: null, publisher: "Demo publisher", set: null, series: "Pocket Monsters printed matter", cardNumber: null, catalogNumber: "PA-0004", edition: null, printing: null, condition: "Very Good", conditionNotes: "Demo description; the final listing would note folds, toning, handling, and surface wear.", dimensions: "To be measured", provenance: "Demonstration listing; no physical item is represented.", acquisitionSource: "Founder collection demo", acquisitionDate: "2026", pokemonIds: [], pokemonNames: [], artistIds: [], relatedMuseumIds: ["inventing-a-world"], relatedArchiveIds: ["reddit-concept-3"], relatedCardIds: [], relatedCollectionIds: ["early-printed-matter"], tags: ["From the Archive", "Vintage Japanese", "Ephemera"], fromArchive: true, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "collection", availabilityStatus: "not-for-sale", price: null, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [demoPlaceholder], sourceMetadata: "Listing pending live inventory photography.", rightsMetadata: "Shop images must be original photographs of owned physical inventory.", featured: true, demo: true,
  },
  {
    accessionNumber: "PA-0005", id: "DEMO-005", slug: "demo-original-starter-evolution-lines", title: "Original Starter Evolution Lines", subtitle: "Curated set — sample listing", objectType: "Curated set", category: "Curated Collections",
    description: "A demonstration set showing how several cards could be presented together and later offered as one collection or as individual pieces.", archivalNote: "Bulbasaur, Charmander, and Squirtle arrived relatively late in the original internal sequence, yet became the balanced introduction to the Pokémon world.", culturalSignificance: "Shows how one physical grouping can connect to multiple Pokémon and a single design-era narrative.",
    year: 1996, approximateYear: true, era: "Launch era · 1996", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Mixed pieces", publisher: "Mixed publishers", set: "Editorial demonstration grouping", series: "Original starters", cardNumber: null, catalogNumber: "PA-0005", edition: null, printing: null, condition: "Mixed", conditionNotes: "Condition would be recorded separately for every included piece.", dimensions: null, provenance: "Demonstration listing; no physical items are represented.", acquisitionSource: null, acquisitionDate: null, pokemonIds: [1, 4, 7], pokemonNames: ["Bulbasaur", "Charmander", "Squirtle"], artistIds: ["ken-sugimori"], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: ["original-starters"], tags: ["Curated Collections", "Sugimori", "Original 151"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 72, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [demoPlaceholder], sourceMetadata: "Listing pending live inventory photography.", rightsMetadata: "Shop images must be original photographs of owned physical inventory.", featured: true, demo: true,
  },
];

const demoListingOverrides: Partial<InventoryItem>[] = [
  { subtitle: "1999 Base Set — sample listing", objectType: "Trading card", category: "Cards", year: 1999, approximateYear: false, set: "Base Set", series: "Wizards of the Coast", cardNumber: "44", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast" },
  { subtitle: "1999 Fossil — private-sale study", objectType: "Trading card", category: "Cards", year: 1999, approximateYear: false, set: "Fossil", series: "Wizards of the Coast", cardNumber: "21", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", commerceMode: "privateSale", availabilityStatus: "available", recordState: "collection", reserved: false, price: null },
  { subtitle: "1999 Black Star Promo — sample listing", objectType: "Promo card", category: "Promos", year: 1999, approximateYear: false, set: "Wizards Black Star Promos", series: "Black Star Promo", cardNumber: "1", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", availabilityStatus: "available", recordState: "available", quantity: 1, soldDate: null, price: 14 },
  { title: "Mew", subtitle: "2000 Black Star Promo — sample listing", objectType: "Promo card", category: "Promos", year: 2000, approximateYear: false, set: "Wizards Black Star Promos", series: "Black Star Promo", cardNumber: "9", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", pokemonIds: [151], pokemonNames: ["Mew"], price: 45, availabilityStatus: "available", recordState: "available", quantity: 1 },
  { subtitle: "1999 Base Set trio — sample listing", objectType: "Three-card set", category: "Curated Collections", year: 1999, approximateYear: false, set: "Base Set", series: "Wizards of the Coast", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast" },
];

demoInventory.forEach((item, index) => {
  Object.assign(item, demoListingOverrides[index], {
    images: index === 4 ? starterVisuals : [demoVisuals[index]],
    sourceMetadata: "Temporary card scan sourced through the Pokémon TCG API; replace with photos of the listed card.",
    rightsMetadata: "Display-only sample image. Live listings should use photos of the card being sold.",
  });
});

demoInventory.push(
  {
    ...demoInventory[0],
    accessionNumber: "PA-0006",
    id: "DEMO-006",
    slug: "demo-sugimori-art-pair",
    title: "Sugimori Art Pair",
    subtitle: "Bulbasaur and Haunter — sample collection",
    objectType: "Two-card set",
    category: "Curated Collections",
    description: "A two-card sample collection centered on Ken Sugimori's original character artwork.",
    archivalNote: "Two very different silhouettes show the range and economy of Sugimori's early Pokémon designs.",
    pokemonIds: [1, 93],
    pokemonNames: ["Bulbasaur", "Haunter"],
    set: "Sugimori Art",
    series: "Mixed early cards",
    cardNumber: null,
    catalogNumber: "PA-0006",
    relatedCollectionIds: ["sugimori-art"],
    tags: ["Curated Collections", "Sugimori", "Original 151"],
    price: 45,
    images: [demoVisuals[0], demoVisuals[1]],
  },
  {
    ...demoInventory[2],
    accessionNumber: "PA-0007",
    id: "DEMO-007",
    slug: "demo-black-star-promo-pair",
    title: "Black Star Promo Pair",
    subtitle: "Pikachu and Mew — sample collection",
    objectType: "Two-card set",
    category: "Curated Collections",
    description: "A two-card sample collection pairing two memorable Wizards Black Star Promos.",
    archivalNote: "Pikachu and Mew capture two sides of the early international Pokémon phenomenon: mascot and mystery.",
    pokemonIds: [25, 151],
    pokemonNames: ["Pikachu", "Mew"],
    set: "Wizards Black Star Promos",
    series: "Black Star Promo",
    cardNumber: null,
    catalogNumber: "PA-0007",
    relatedCollectionIds: ["black-star-promos"],
    tags: ["Curated Collections", "Promos", "Original 151"],
    recordState: "available",
    availabilityStatus: "available",
    quantity: 1,
    soldDate: null,
    price: 65,
    images: [demoVisuals[2], demoVisuals[3]],
  },
);

export const demoCuratedCollections: CuratedCollection[] = [
  { id: "DEMO-COLLECTION-001", slug: "gastly-haunter-gengar", title: "Gastly / Haunter / Gengar", description: "Pieces tracing one of Kanto’s most visually coherent evolution lines.", curatorNote: "A future grouping can mix cards, printed matter, and production references while retaining item-level records.", era: "1996–present", featuredImage: null, inventoryIds: ["DEMO-002"], pokemonIds: [92, 93, 94], relatedArchiveIds: [], relatedMuseumIds: ["public-visual-identity"], saleMode: "individual", collectionPrice: null, currency: "USD", demo: true },
  { id: "DEMO-COLLECTION-002", slug: "original-starters", title: "Original Starter Evolution Lines", description: "A demonstration collection joining the three original partners through one editorial idea.", curatorNote: "Configured as a grouped set while retaining item-level metadata for a future inventory provider.", era: "1996", featuredImage: null, inventoryIds: ["DEMO-005"], pokemonIds: [1, 4, 7], relatedArchiveIds: [], relatedMuseumIds: ["public-visual-identity"], saleMode: "group", collectionPrice: 72, currency: "USD", demo: true },
];

export const inventoryCollectionOptions = ["New Acquisitions", "From the Archive", "Sugimori", "Vintage Japanese", "Carddass", "Promos", "Cards", "Ephemera", "Printed Matter", "Curated Collections", "Archived / Sold"] as const;

export const SHOP_ORIGIN = "https://shop.pocketarchives.com";
export const ARCHIVE_ORIGIN = "https://pocketarchives.com";

export function shopObjectUrl(slug: string) { return `${SHOP_ORIGIN}/objects/${slug}`; }
export function inventoryBySlug(slug: string) { return demoInventory.find((item) => item.slug === slug); }
export function inventoryForPokemon(pokemonId: number) { return demoInventory.filter((item) => item.pokemonIds.includes(pokemonId)); }
export function inventoryForMuseum(museumId: string) { return demoInventory.filter((item) => item.relatedMuseumIds.includes(museumId)); }
export function statusLabel(status: AvailabilityStatus) {
  if (status === "sold") return "Sold — Archived";
  if (status === "not-for-sale") return "Not available for acquisition";
  if (status === "available") return "Available for acquisition";
  return "Reserved";
}
export function recordStateLabel(state: RecordState) {
  if (state === "private-collection") return "Private Collection";
  if (state === "collection") return "Pocket Archives Collection";
  return "Available for Acquisition";
}
export function formatPrice(price: number | null, currency: string) {
  if (price === null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}
