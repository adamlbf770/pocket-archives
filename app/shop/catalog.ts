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
  demo: boolean;
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

function referenceScan(src: string, subject: string): ObjectImage {
  return {
    src,
    caption: `${subject} reference scan — replace with photographs of the card being sold.`,
    view: "placeholder",
    creator: "Bulbagarden Archives contributor",
    rightsHolder: "Pokémon rights holders",
    rightsStatus: "display-only",
    usageBasis: "Temporary historical reference scan sourced through Bulbagarden Archives",
  };
}

function ownedPhoto(src: string, caption: string, view: "front" | "back"): ObjectImage {
  return {
    src,
    caption,
    view,
    creator: "Pocket Archives",
    rightsHolder: "Pocket Archives",
    rightsStatus: "allowed",
    usageBasis: "Original photograph of physical inventory owned by Pocket Archives",
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

// Unified shop inventory. Sample records use demo: true; photographed physical inventory uses demo: false.
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

// LIVE INVENTORY — photographed physical listings.
demoInventory.push({
  accessionNumber: "PA-0012",
  id: "LIVE-001",
  slug: "girafarig-neo-genesis-58-111",
  title: "Girafarig",
  subtitle: "2000 Neo Genesis 58/111 — live card test",
  objectType: "Trading card",
  category: "Cards",
  description: "The first live Pocket Archives inventory test: an English Neo Genesis Girafarig photographed front and back and offered as a single card.",
  archivalNote: "Girafarig’s two-headed silhouette is especially suited to Ken Sugimori’s clean early character language, while Neo Genesis records Pokémon’s first major expansion beyond Kanto.",
  culturalSignificance: "A modest, accessible card marking the transition from demonstration listings to photographed Pocket Archives inventory.",
  year: 2000,
  approximateYear: false,
  era: "Neo era · 2000",
  country: "United States",
  language: "English",
  artist: "Ken Sugimori",
  illustrator: "Ken Sugimori",
  manufacturer: "Wizards of the Coast",
  publisher: "Wizards of the Coast",
  set: "Neo Genesis",
  series: "Neo",
  cardNumber: "58/111",
  catalogNumber: "PA-0012",
  edition: "Unlimited",
  printing: "English",
  condition: "Moderately Played",
  conditionNotes: "Visible edge whitening and corner wear on the reverse, with general handling wear. Review both original photographs before inquiring.",
  dimensions: "Approx. 63.5 × 88 mm",
  provenance: "Owned and photographed by Pocket Archives; entered as the first live inventory test card.",
  acquisitionSource: "Pocket Archives founder collection",
  acquisitionDate: "2026-08-15",
  pokemonIds: [203],
  pokemonNames: ["Girafarig"],
  artistIds: ["ken-sugimori"],
  relatedMuseumIds: ["public-visual-identity"],
  relatedArchiveIds: [],
  relatedCardIds: [],
  relatedCollectionIds: [],
  tags: ["Live Inventory", "Neo Genesis", "Sugimori", "Singles", "Cards"],
  fromArchive: false,
  physicalOwnership: true,
  commerceMode: "fixedPrice",
  recordState: "available",
  availabilityStatus: "available",
  price: 0.5,
  currency: "USD",
  quantity: 1,
  reserved: false,
  soldDate: null,
  placedInPrivateCollection: false,
  images: [
    ownedPhoto("/shop/inventory/pa-0012-front.jpg", "Girafarig Neo Genesis 58/111 — photographed front", "front"),
    ownedPhoto("/shop/inventory/pa-0012-back.jpg", "Girafarig Neo Genesis 58/111 — photographed reverse", "back"),
  ],
  sourceMetadata: "Original front and back inventory photographs made by Pocket Archives on 2026-08-15.",
  rightsMetadata: "Original Pocket Archives inventory photography.",
  featured: true,
  demo: false,
});

// LIVE INVENTORY — synchronized from the Pocket_Archives eBay account.
demoInventory.push(
  {
    accessionNumber: "PA-0016", id: "LIVE-005", slug: "delibird-152-132-mega-evolution", title: "Delibird", subtitle: "2025 Mega Evolution 152/132 · Illustration Rare", objectType: "Trading card", category: "Cards",
    description: "A lightly played English Delibird Illustration Rare, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "The full-art composition turns Delibird’s delivery motif into a complete illustrated scene, showing how modern rarity treatments can expand a character beyond the card frame.", culturalSignificance: "A contemporary Illustration Rare offered as an approachable example of modern Pokémon card art.",
    year: 2025, approximateYear: false, era: "Modern era · 2025", country: "United States", language: "English", artist: "Takeshi Nakamura", illustrator: "Takeshi Nakamura", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "Mega Evolution", series: "Mega Evolution", cardNumber: "152/132", catalogNumber: "PA-0016", edition: null, printing: "English", condition: "Lightly Played", conditionNotes: "Light signs of handling and wear consistent with the seller-listed LP condition. Review both photographs before purchase.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192379038.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [225], pokemonNames: ["Delibird"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Illustration Rare", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0016-front.webp", "Delibird 152/132 — photographed front", "front"), ownedPhoto("/shop/inventory/pa-0016-back.webp", "Delibird 152/132 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $2.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0017", id: "LIVE-006", slug: "doublade-098-088-perfect-order", title: "Doublade", subtitle: "2026 Perfect Order 098/088 · Illustration Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint English Doublade Illustration Rare from Perfect Order, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "Anesaki Dynamic’s illustration uses Doublade’s mirrored weapon design as the structure of the entire image rather than treating the Pokémon as a figure placed over a background.", culturalSignificance: "A compact example of the increasingly illustration-led identity of modern Pokémon collecting.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "United States", language: "English", artist: "Anesaki Dynamic", illustrator: "Anesaki Dynamic", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "Perfect Order", series: "Mega Evolution", cardNumber: "098/088", catalogNumber: "PA-0017", edition: null, printing: "English", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192376610.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [680], pokemonNames: ["Doublade"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Illustration Rare", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0017-front.webp", "Doublade 098/088 — photographed front", "front"), ownedPhoto("/shop/inventory/pa-0017-back.webp", "Doublade 098/088 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $4.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0018", id: "LIVE-007", slug: "heliolisk-229-217-ascended-heroes", title: "Heliolisk", subtitle: "2026 Ascended Heroes 229/217 · Illustration Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint English Heliolisk Illustration Rare from Ascended Heroes, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "The wide environmental composition gives Heliolisk a sense of scale and motion while keeping the Pokémon’s graphic frill as the visual anchor.", culturalSignificance: "An affordable modern art card that demonstrates the TCG’s shift toward scene-driven illustration.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "United States", language: "English", artist: "SVLT", illustrator: "SVLT", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "Ascended Heroes", series: "Mega Evolution", cardNumber: "229/217", catalogNumber: "PA-0018", edition: null, printing: "English", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192370693.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [695], pokemonNames: ["Heliolisk"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Illustration Rare", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0018-front.webp", "Heliolisk 229/217 — photographed front", "front"), ownedPhoto("/shop/inventory/pa-0018-back.webp", "Heliolisk 229/217 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $2.49 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0019", id: "LIVE-008", slug: "zarude-090-081-m5-abyss-eye", title: "Zarude", subtitle: "2026 M5 Abyss Eye 090/081 · Japanese Art Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint Japanese Zarude Art Rare from M5: Abyss Eye, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "Matazo places Zarude inside a dense, atmospheric environment, using the Art Rare format to emphasize the Pokémon’s place within a living world.", culturalSignificance: "A Japanese-language contemporary art card connecting the shop’s modern inventory to Pokémon’s home market.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "Japan", language: "Japanese", artist: "Matazo", illustrator: "Matazo", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "M5: Abyss Eye", series: "Pokémon Card Game", cardNumber: "090/081", catalogNumber: "PA-0019", edition: null, printing: "Japanese", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint and described as excellent overall. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192369332.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [893], pokemonNames: ["Zarude"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Art Rare", "Japanese", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0019-front.webp", "Zarude 090/081 — photographed front", "front"), ownedPhoto("/shop/inventory/pa-0019-back.webp", "Zarude 090/081 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $4.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
);

demoInventory.push(
  {
    accessionNumber: "PA-0013",
    id: "LIVE-002",
    slug: "marill-expedition-120-165",
    title: "Marill",
    subtitle: "2002 Expedition 120/165 — e-Reader",
    objectType: "Trading card",
    category: "Cards",
    description: "An English Expedition Base Set Marill from the first e-Card era, scanned front and back as live Pocket Archives inventory.",
    archivalNote: "Expedition introduced the e-Reader border and dot-code strip to the English Pokémon TCG, making the card itself part collectible and part game interface.",
    culturalSignificance: "A compact example of Pokémon's early-2000s experiment with linking physical cards to Nintendo hardware.",
    year: 2002,
    approximateYear: false,
    era: "e-Card era · 2002",
    country: "United States",
    language: "English",
    artist: "Satoshi Ohta",
    illustrator: "Satoshi Ohta",
    manufacturer: "Wizards of the Coast",
    publisher: "Wizards of the Coast",
    set: "Expedition Base Set",
    series: "e-Card",
    cardNumber: "120/165",
    catalogNumber: "PA-0013",
    edition: "Unlimited",
    printing: "English",
    condition: "Moderately Played",
    conditionNotes: "Visible edge and corner wear with surface handling. Review the full-resolution front and reverse scans before inquiring.",
    dimensions: "Approx. 63.5 × 88 mm",
    provenance: "Owned and scanned by Pocket Archives; entered as live inventory on 2026-08-15.",
    acquisitionSource: "Pocket Archives founder collection",
    acquisitionDate: "2026-08-15",
    pokemonIds: [183],
    pokemonNames: ["Marill"],
    artistIds: ["satoshi-ohta"],
    relatedMuseumIds: ["platform-ecosystem"],
    relatedArchiveIds: [],
    relatedCardIds: [],
    relatedCollectionIds: [],
    tags: ["Live Inventory", "Expedition", "e-Reader", "Singles", "Cards"],
    fromArchive: false,
    physicalOwnership: true,
    commerceMode: "fixedPrice",
    recordState: "available",
    availabilityStatus: "available",
    price: 4.99,
    currency: "USD",
    quantity: 1,
    reserved: false,
    soldDate: null,
    placedInPrivateCollection: false,
    images: [
      ownedPhoto("/shop/inventory/pa-0013-front.jpg", "Marill Expedition 120/165 — scanned front", "front"),
      ownedPhoto("/shop/inventory/pa-0013-back.jpg", "Marill Expedition 120/165 — scanned reverse", "back"),
    ],
    sourceMetadata: "Original front and back inventory scans made by Pocket Archives on 2026-08-15. Also listed through the Pocket_Archives eBay account as item 158192286524; the Pocket Archives price is $1 below the $5.99 eBay price.",
    rightsMetadata: "Original Pocket Archives inventory scan.",
    featured: true,
    demo: false,
  },
  {
    accessionNumber: "PA-0014",
    id: "LIVE-003",
    slug: "drowzee-bandai-carddass-097",
    title: "Hypno",
    subtitle: "1997 Pocket Monsters Carddass — File No.097",
    objectType: "Collectible card",
    category: "Carddass",
    description: "A 1997 Japanese Pocket Monsters Carddass Hypno, File No.097, scanned front and back as live Pocket Archives inventory.",
    archivalNote: "Bandai's File Number Carddass series combined character scenes with Pokédex-style information, game statistics, and attacks on the reverse.",
    culturalSignificance: "A vending-machine collectible from Pokémon's rapid expansion across Japanese games, animation, and print culture.",
    year: 1997,
    approximateYear: false,
    era: "Early franchise · 1997",
    country: "Japan",
    language: "Japanese",
    artist: null,
    illustrator: null,
    manufacturer: "Bandai",
    publisher: "Bandai",
    set: "Pocket Monsters Carddass",
    series: "File Number · Part 3 & 4",
    cardNumber: "097",
    catalogNumber: "PA-0014",
    edition: null,
    printing: "Japanese",
    condition: "Near Mint",
    conditionNotes: "Clean near-mint copy with only minimal handling visible. Review both original scans before inquiring.",
    dimensions: "Approx. 59 × 86 mm",
    provenance: "Owned and scanned by Pocket Archives; entered as live inventory on 2026-08-15.",
    acquisitionSource: "Pocket Archives founder collection",
    acquisitionDate: "2026-08-15",
    pokemonIds: [97],
    pokemonNames: ["Hypno"],
    artistIds: [],
    relatedMuseumIds: ["public-visual-identity"],
    relatedArchiveIds: ["carddass-action-1"],
    relatedCardIds: [],
    relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"],
    tags: ["Live Inventory", "Carddass", "Vintage Japanese", "Original 151", "Singles"],
    fromArchive: false,
    physicalOwnership: true,
    commerceMode: "fixedPrice",
    recordState: "available",
    availabilityStatus: "available",
    price: 11.99,
    currency: "USD",
    quantity: 1,
    reserved: false,
    soldDate: null,
    placedInPrivateCollection: false,
    images: [
      ownedPhoto("/shop/inventory/pa-0014-front.jpg", "Hypno Pocket Monsters Carddass File No.097 — scanned front", "front"),
      ownedPhoto("/shop/inventory/pa-0014-back.jpg", "Hypno Pocket Monsters Carddass File No.097 — scanned reverse", "back"),
    ],
    sourceMetadata: "Original front and back inventory scans made by Pocket Archives on 2026-08-15.",
    rightsMetadata: "Original Pocket Archives inventory scan.",
    featured: true,
    demo: false,
  },
  {
    accessionNumber: "PA-0015",
    id: "LIVE-004",
    slug: "slowbro-bandai-carddass-080",
    title: "Slowbro",
    subtitle: "1997 Pocket Monsters Carddass — File No.080",
    objectType: "Collectible card",
    category: "Carddass",
    description: "A 1997 Japanese Pocket Monsters Carddass Slowbro, File No.080, scanned front and back as live Pocket Archives inventory.",
    archivalNote: "This later Carddass design combines a full character illustration with a reverse-side field guide, game statistics, and Slowbro's signature Amnesia move.",
    culturalSignificance: "A vending-machine collectible from the period when Pokémon's game data, television identity, and character humor were converging into one visual language.",
    year: 1997,
    approximateYear: false,
    era: "Early franchise · 1997",
    country: "Japan",
    language: "Japanese",
    artist: null,
    illustrator: null,
    manufacturer: "Bandai",
    publisher: "Bandai",
    set: "Pocket Monsters Carddass",
    series: "File Number · Part 3 & 4",
    cardNumber: "080",
    catalogNumber: "PA-0015",
    edition: null,
    printing: "Japanese",
    condition: "Near Mint",
    conditionNotes: "Clean near-mint copy with only minimal handling visible. Review both original scans before inquiring.",
    dimensions: "Approx. 59 × 86 mm",
    provenance: "Owned and scanned by Pocket Archives; entered as live inventory on 2026-08-15.",
    acquisitionSource: "Pocket Archives founder collection",
    acquisitionDate: "2026-08-15",
    pokemonIds: [80],
    pokemonNames: ["Slowbro"],
    artistIds: [],
    relatedMuseumIds: ["public-visual-identity"],
    relatedArchiveIds: ["carddass-action-1"],
    relatedCardIds: [],
    relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"],
    tags: ["Live Inventory", "Carddass", "Vintage Japanese", "Original 151", "Singles"],
    fromArchive: false,
    physicalOwnership: true,
    commerceMode: "fixedPrice",
    recordState: "available",
    availabilityStatus: "available",
    price: 14.99,
    currency: "USD",
    quantity: 1,
    reserved: false,
    soldDate: null,
    placedInPrivateCollection: false,
    images: [
      ownedPhoto("/shop/inventory/pa-0015-front.jpg", "Slowbro Pocket Monsters Carddass File No.080 — scanned front", "front"),
      ownedPhoto("/shop/inventory/pa-0015-back.jpg", "Slowbro Pocket Monsters Carddass File No.080 — scanned reverse", "back"),
    ],
    sourceMetadata: "Original front and back inventory scans made by Pocket Archives on 2026-08-15.",
    rightsMetadata: "Original Pocket Archives inventory scan.",
    featured: true,
    demo: false,
  },
  {
    accessionNumber: "PA-0020", id: "LIVE-009", slug: "ledyba-neo-genesis-63-111-first-edition", title: "Ledyba", subtitle: "2000 Neo Genesis 63/111 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Neo Genesis Ledyba, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Neo Genesis introduced Johto to the English TCG and translated the second generation's softer, more playful character language into the original card frame.", culturalSignificance: "A first-edition Johto common illustrated by Sumiyoshi Kizuki during Pokémon's first major generational expansion.",
    year: 2000, approximateYear: false, era: "Neo era · 2000", country: "United States", language: "English", artist: "Sumiyoshi Kizuki", illustrator: "Sumiyoshi Kizuki", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Neo Genesis", series: "Neo", cardNumber: "63/111", catalogNumber: "PA-0020", edition: "1st Edition", printing: "English", condition: "Moderately Played", conditionNotes: "Visible edge and corner wear with scattered surface handling. Review the full-resolution front and reverse scans for the exact copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [165], pokemonNames: ["Ledyba"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Genesis", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0020-front.jpg", "Ledyba Neo Genesis 63/111 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/pa-0020-back.jpg", "Ledyba Neo Genesis 63/111 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0021", id: "LIVE-010", slug: "vileplume-jungle-31-64-first-edition", title: "Vileplume", subtitle: "1999 Jungle 31/64 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Jungle Vileplume non-holo rare, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Jungle was the first English expansion to move beyond Base Set, giving familiar Pokémon larger character portraits and a stronger sense of habitat.", culturalSignificance: "A first-edition non-holo rare from the earliest English expansion, with Keiji Kinebuchi's distinctive pre-rendered character artwork.",
    year: 1999, approximateYear: false, era: "Wizards era · 1999", country: "United States", language: "English", artist: "Keiji Kinebuchi", illustrator: "Keiji Kinebuchi", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Jungle", series: "Wizards of the Coast", cardNumber: "31/64", catalogNumber: "PA-0021", edition: "1st Edition", printing: "English", condition: "Heavily Played", conditionNotes: "Heavy whitening and edge wear with surface marks and corner wear. Review both scans carefully before purchase.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [45], pokemonNames: ["Vileplume"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Jungle", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 4.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0021-front.jpg", "Vileplume Jungle 31/64 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/pa-0021-back.jpg", "Vileplume Jungle 31/64 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0022", id: "LIVE-011", slug: "seel-neo-destiny-81-105-first-edition", title: "Seel", subtitle: "2002 Neo Destiny 81/105 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Neo Destiny Seel, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Neo Destiny closed the original Neo block and paired light and dark themes with one of the Wizards era's most ambitious set structures.", culturalSignificance: "A first-edition common from the final English Neo expansion, illustrated by Masako Yamashita.",
    year: 2002, approximateYear: false, era: "Neo era · 2002", country: "United States", language: "English", artist: "Masako Yamashita", illustrator: "Masako Yamashita", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Neo Destiny", series: "Neo", cardNumber: "81/105", catalogNumber: "PA-0022", edition: "1st Edition", printing: "English", condition: "Moderately Played", conditionNotes: "Visible reverse-edge whitening, corner wear, and light surface handling. Review both scans for the exact copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [86], pokemonNames: ["Seel"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Destiny", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 2.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0022-front.jpg", "Seel Neo Destiny 81/105 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/pa-0022-back.jpg", "Seel Neo Destiny 81/105 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0023", id: "LIVE-012", slug: "mistys-horsea-gym-challenge-87-132-first-edition", title: "Misty's Horsea", subtitle: "2000 Gym Challenge 87/132 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Gym Challenge Misty's Horsea, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Gym Challenge deepened the TCG's connection to the games and animation by organizing Pokémon around named trainers and recognizable relationships.", culturalSignificance: "A first-edition trainer-owned Pokémon card using Ken Sugimori artwork during the Wizards era.",
    year: 2000, approximateYear: false, era: "Wizards era · 2000", country: "United States", language: "English", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Gym Challenge", series: "Gym", cardNumber: "87/132", catalogNumber: "PA-0023", edition: "1st Edition", printing: "English", condition: "Damaged", conditionNotes: "Prominent paper loss on the reverse, plus edge whitening, corner wear, and surface handling. The damage is clearly shown in the reverse scan.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [116], pokemonNames: ["Horsea"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Gym Challenge", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/pa-0023-front.jpg", "Misty's Horsea Gym Challenge 87/132 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/pa-0023-back.jpg", "Misty's Horsea Gym Challenge 87/132 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position four.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
);

demoInventory.push(
  {
    ...demoInventory[0],
    accessionNumber: "PA-0008", id: "DEMO-008", slug: "demo-1996-carddass-pikachu", title: "Pikachu", subtitle: "1996 Bandai Carddass — sample listing", objectType: "Collectible card", category: "Carddass",
    description: "A sample listing for an early Bandai Carddass Pikachu, one of the small-format cards that helped move Pokémon from the Game Boy into everyday collecting.", archivalNote: "Bandai's September 1996 Carddass release predates the Pokémon Trading Card Game and belongs to the franchise's earliest official collectible-card history.", culturalSignificance: "An affordable entry point into the first year of Pokémon collecting culture.",
    year: 1996, approximateYear: false, era: "Launch era · 1996", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Bandai", publisher: "Bandai", set: "Pokémon Carddass Part 1 & 2", series: "Green / red back", cardNumber: "025", catalogNumber: "PA-0008", edition: null, printing: null, condition: "Very Good", conditionNotes: "Sample condition only. Live listing will document corners, surface, color, and reverse.", dimensions: "Approx. 59 × 86 mm", provenance: "Sample listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [25], pokemonNames: ["Pikachu"], artistIds: ["ken-sugimori"], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: ["carddass-action-1"], relatedCardIds: [], relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"], tags: ["Carddass", "Vintage Japanese", "Original 151", "The Binder"], fromArchive: true, physicalOwnership: false, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 18, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [referenceScan("/shop/cards/carddass-pikachu.jpg", "1996 Pikachu Carddass")], sourceMetadata: "Historical reference scan from Bulbagarden Archives; final listing requires original inventory photography.", rightsMetadata: "Display-only reference image. Replace with original photographs before sale.", featured: false, demo: true,
  },
  {
    ...demoInventory[0],
    accessionNumber: "PA-0009", id: "DEMO-009", slug: "demo-1996-carddass-charmander", title: "Charmander", subtitle: "1996 Bandai Carddass — sample listing", objectType: "Collectible card", category: "Carddass",
    description: "A sample listing for an early Bandai Carddass Charmander, built for collectors who want historically meaningful pieces without chasing only expensive rarities.", archivalNote: "The original Carddass run translated Sugimori's character art into a numbered pocket encyclopedia before the TCG became the dominant card format.", culturalSignificance: "A direct link between the original Pokédex and vending-machine collecting.",
    year: 1996, approximateYear: false, era: "Launch era · 1996", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Bandai", publisher: "Bandai", set: "Pokémon Carddass Part 1 & 2", series: "Green / red back", cardNumber: "004", catalogNumber: "PA-0009", edition: null, printing: null, condition: "Very Good", conditionNotes: "Sample condition only. Live listing will document corners, surface, color, and reverse.", dimensions: "Approx. 59 × 86 mm", provenance: "Sample listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [4], pokemonNames: ["Charmander"], artistIds: ["ken-sugimori"], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: ["carddass-action-1"], relatedCardIds: [], relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"], tags: ["Carddass", "Vintage Japanese", "Original 151", "The Binder"], fromArchive: true, physicalOwnership: false, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 16, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [referenceScan("/shop/cards/carddass-charmander.jpg", "1996 Charmander Carddass")], sourceMetadata: "Historical reference scan from Bulbagarden Archives; final listing requires original inventory photography.", rightsMetadata: "Display-only reference image. Replace with original photographs before sale.", featured: false, demo: true,
  },
  {
    ...demoInventory[0],
    accessionNumber: "PA-0010", id: "DEMO-010", slug: "demo-1997-meiji-get-card-mewtwo", title: "Mewtwo", subtitle: "1997 Meiji Get Card — sample listing", objectType: "Snack premium card", category: "Ephemera",
    description: "A sample listing for a Meiji Get Card distributed with Japanese confectionery, preserving the point where Pokémon collecting entered ordinary snack-counter life.", archivalNote: "Meiji's compact premiums show that Pokémon culture did not grow through hobby shops alone; it was also collected through inexpensive everyday products.", culturalSignificance: "Consumer ephemera from Pokémon's rapid spread across late-1990s Japan.",
    year: 1997, approximateYear: false, era: "Early franchise · 1997", country: "Japan", language: "Japanese", artist: null, illustrator: null, manufacturer: "Meiji", publisher: "Meiji", set: "Pokémon Get Cards", series: "1997", cardNumber: "150", catalogNumber: "PA-0010", edition: null, printing: null, condition: "Good", conditionNotes: "Sample condition only. Live listing will note bends, rub, surface wear, and reverse.", dimensions: "To be measured", provenance: "Sample listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [150], pokemonNames: ["Mewtwo"], artistIds: [], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: ["everyday-pokemon-japan"], tags: ["Meiji", "Ephemera", "Vintage Japanese", "The Binder"], fromArchive: true, physicalOwnership: false, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 12, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [referenceScan("/shop/cards/meiji-1997-mewtwo.jpeg", "1997 Mewtwo Meiji Get Card")], sourceMetadata: "Historical reference scan from Bulbagarden Archives; final listing requires original inventory photography.", rightsMetadata: "Display-only reference image. Replace with original photographs before sale.", featured: false, demo: true,
  },
  {
    ...demoInventory[0],
    accessionNumber: "PA-0011", id: "DEMO-011", slug: "demo-1997-meiji-get-card-charizard", title: "Charizard", subtitle: "1997 Meiji Get Card — sample listing", objectType: "Snack premium card", category: "Ephemera",
    description: "A sample listing for a 1997 Meiji Get Card featuring Charizard, a small piece of Japanese consumer print culture with a very large collector afterlife.", archivalNote: "Snack premiums made collecting casual and social: inexpensive cards encountered in daily life rather than reserved for a dedicated card game.", culturalSignificance: "A compact record of Pokémon's transition from game release to mass cultural presence.",
    year: 1997, approximateYear: false, era: "Early franchise · 1997", country: "Japan", language: "Japanese", artist: null, illustrator: null, manufacturer: "Meiji", publisher: "Meiji", set: "Pokémon Get Cards", series: "1997", cardNumber: "006", catalogNumber: "PA-0011", edition: null, printing: null, condition: "Good", conditionNotes: "Sample condition only. Live listing will note bends, rub, surface wear, and reverse.", dimensions: "To be measured", provenance: "Sample listing; no physical item is represented.", acquisitionSource: null, acquisitionDate: null,
    pokemonIds: [6], pokemonNames: ["Charizard"], artistIds: [], relatedMuseumIds: ["public-visual-identity"], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: ["everyday-pokemon-japan"], tags: ["Meiji", "Ephemera", "Vintage Japanese", "The Binder"], fromArchive: true, physicalOwnership: false, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 14, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false, images: [referenceScan("/shop/cards/meiji-1997-charizard.jpg", "1997 Charizard Meiji Get Card")], sourceMetadata: "Historical reference scan from Bulbagarden Archives; final listing requires original inventory photography.", rightsMetadata: "Display-only reference image. Replace with original photographs before sale.", featured: false, demo: true,
  },
);

export const demoCuratedCollections: CuratedCollection[] = [
  { id: "DEMO-COLLECTION-001", slug: "gastly-haunter-gengar", title: "Gastly / Haunter / Gengar", description: "Pieces tracing one of Kanto’s most visually coherent evolution lines.", curatorNote: "A future grouping can mix cards, printed matter, and production references while retaining item-level records.", era: "1996–present", featuredImage: null, inventoryIds: ["DEMO-002"], pokemonIds: [92, 93, 94], relatedArchiveIds: [], relatedMuseumIds: ["public-visual-identity"], saleMode: "individual", collectionPrice: null, currency: "USD", demo: true },
  { id: "DEMO-COLLECTION-002", slug: "original-starters", title: "Original Starter Evolution Lines", description: "A demonstration collection joining the three original partners through one editorial idea.", curatorNote: "Configured as a grouped set while retaining item-level metadata for a future inventory provider.", era: "1996", featuredImage: null, inventoryIds: ["DEMO-005"], pokemonIds: [1, 4, 7], relatedArchiveIds: [], relatedMuseumIds: ["public-visual-identity"], saleMode: "group", collectionPrice: 72, currency: "USD", demo: true },
];

export const inventoryCollectionOptions = ["New Acquisitions", "From the Archive", "Sugimori", "Vintage Japanese", "Carddass", "Promos", "Cards", "Ephemera", "Printed Matter", "Curated Collections", "Archived / Sold"] as const;

export const SHOP_ORIGIN = "https://shop.pocketarchives.com";
export const SHOP_HOME = `${SHOP_ORIGIN}/shop`;
export const ARCHIVE_ORIGIN = "https://pocketarchives.com";

export function shopObjectUrl(slug: string) { return `${SHOP_ORIGIN}/objects/${slug}`; }
export function inventoryBySlug(slug: string) { return demoInventory.find((item) => item.slug === slug && !item.demo); }
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
  const showCents = price % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(price);
}
