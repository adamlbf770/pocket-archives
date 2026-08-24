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
  tags: ["Live Inventory", "Neo Genesis", "Common", "Sugimori", "Singles", "Cards"],
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
    ownedPhoto("/shop/inventory/batch-01/pa-0012-front.jpg", "Girafarig Neo Genesis 58/111 — photographed front", "front"),
    ownedPhoto("/shop/inventory/batch-01/pa-0012-back.jpg", "Girafarig Neo Genesis 58/111 — photographed reverse", "back"),
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
    images: [ownedPhoto("/shop/inventory/ebay-import/pa-0016-front.webp", "Delibird 152/132 — photographed front", "front"), ownedPhoto("/shop/inventory/ebay-import/pa-0016-back.webp", "Delibird 152/132 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $2.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0017", id: "LIVE-006", slug: "doublade-098-088-perfect-order", title: "Doublade", subtitle: "2026 Perfect Order 098/088 · Illustration Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint English Doublade Illustration Rare from Perfect Order, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "Anesaki Dynamic’s illustration uses Doublade’s mirrored weapon design as the structure of the entire image rather than treating the Pokémon as a figure placed over a background.", culturalSignificance: "A compact example of the increasingly illustration-led identity of modern Pokémon collecting.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "United States", language: "English", artist: "Anesaki Dynamic", illustrator: "Anesaki Dynamic", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "Perfect Order", series: "Mega Evolution", cardNumber: "098/088", catalogNumber: "PA-0017", edition: null, printing: "English", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192376610.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [680], pokemonNames: ["Doublade"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Illustration Rare", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/ebay-import/pa-0017-front.webp", "Doublade 098/088 — photographed front", "front"), ownedPhoto("/shop/inventory/ebay-import/pa-0017-back.webp", "Doublade 098/088 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $4.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0018", id: "LIVE-007", slug: "heliolisk-229-217-ascended-heroes", title: "Heliolisk", subtitle: "2026 Ascended Heroes 229/217 · Illustration Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint English Heliolisk Illustration Rare from Ascended Heroes, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "The wide environmental composition gives Heliolisk a sense of scale and motion while keeping the Pokémon’s graphic frill as the visual anchor.", culturalSignificance: "An affordable modern art card that demonstrates the TCG’s shift toward scene-driven illustration.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "United States", language: "English", artist: "SVLT", illustrator: "SVLT", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "Ascended Heroes", series: "Mega Evolution", cardNumber: "229/217", catalogNumber: "PA-0018", edition: null, printing: "English", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192370693.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [695], pokemonNames: ["Heliolisk"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Illustration Rare", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/ebay-import/pa-0018-front.webp", "Heliolisk 229/217 — photographed front", "front"), ownedPhoto("/shop/inventory/ebay-import/pa-0018-back.webp", "Heliolisk 229/217 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $2.49 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0019", id: "LIVE-008", slug: "zarude-090-081-m5-abyss-eye", title: "Zarude", subtitle: "2026 M5 Abyss Eye 090/081 · Japanese Art Rare", objectType: "Trading card", category: "Cards",
    description: "A near-mint Japanese Zarude Art Rare from M5: Abyss Eye, photographed front and back. The Pocket Archives price is one dollar below the active Pocket_Archives eBay listing.", archivalNote: "Matazo places Zarude inside a dense, atmospheric environment, using the Art Rare format to emphasize the Pokémon’s place within a living world.", culturalSignificance: "A Japanese-language contemporary art card connecting the shop’s modern inventory to Pokémon’s home market.",
    year: 2026, approximateYear: false, era: "Modern era · 2026", country: "Japan", language: "Japanese", artist: "Matazo", illustrator: "Matazo", manufacturer: "The Pokémon Company", publisher: "The Pokémon Company", set: "M5: Abyss Eye", series: "Pokémon Card Game", cardNumber: "090/081", catalogNumber: "PA-0019", edition: null, printing: "Japanese", condition: "Near Mint", conditionNotes: "Seller-listed Near Mint and described as excellent overall. Review the original front and reverse photographs for the exact physical copy.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned by Pocket Archives and listed through the Pocket_Archives eBay account as item 158192369332.", acquisitionSource: "Pocket Archives inventory", acquisitionDate: "2026-08-15",
    pokemonIds: [893], pokemonNames: ["Zarude"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Art Rare", "Japanese", "Singles", "Cards", "eBay Import"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/ebay-import/pa-0019-front.webp", "Zarude 090/081 — photographed front", "front"), ownedPhoto("/shop/inventory/ebay-import/pa-0019-back.webp", "Zarude 090/081 — photographed reverse", "back")], sourceMetadata: "Imported from the active Pocket_Archives eBay listing on 2026-08-15; Pocket Archives price is $1 below the $4.99 eBay price.", rightsMetadata: "Pocket_Archives inventory photography.", featured: true, demo: false,
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
    tags: ["Live Inventory", "Expedition", "e-Reader", "Common", "Singles", "Cards"],
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
      ownedPhoto("/shop/inventory/batch-01/pa-0013-front.jpg", "Marill Expedition 120/165 — scanned front", "front"),
      ownedPhoto("/shop/inventory/batch-01/pa-0013-back.jpg", "Marill Expedition 120/165 — scanned reverse", "back"),
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
      ownedPhoto("/shop/inventory/batch-01/pa-0014-front.jpg", "Hypno Pocket Monsters Carddass File No.097 — scanned front", "front"),
      ownedPhoto("/shop/inventory/batch-01/pa-0014-back.jpg", "Hypno Pocket Monsters Carddass File No.097 — scanned reverse", "back"),
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
      ownedPhoto("/shop/inventory/batch-01/pa-0015-front.jpg", "Slowbro Pocket Monsters Carddass File No.080 — scanned front", "front"),
      ownedPhoto("/shop/inventory/batch-01/pa-0015-back.jpg", "Slowbro Pocket Monsters Carddass File No.080 — scanned reverse", "back"),
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
    pokemonIds: [165], pokemonNames: ["Ledyba"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Genesis", "Common", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-02/pa-0020-front.jpg", "Ledyba Neo Genesis 63/111 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-02/pa-0020-back.jpg", "Ledyba Neo Genesis 63/111 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0021", id: "LIVE-010", slug: "vileplume-jungle-31-64-first-edition", title: "Vileplume", subtitle: "1999 Jungle 31/64 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Jungle Vileplume non-holo rare, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Jungle was the first English expansion to move beyond Base Set, giving familiar Pokémon larger character portraits and a stronger sense of habitat.", culturalSignificance: "A first-edition non-holo rare from the earliest English expansion, with Keiji Kinebuchi's distinctive pre-rendered character artwork.",
    year: 1999, approximateYear: false, era: "Wizards era · 1999", country: "United States", language: "English", artist: "Keiji Kinebuchi", illustrator: "Keiji Kinebuchi", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Jungle", series: "Wizards of the Coast", cardNumber: "31/64", catalogNumber: "PA-0021", edition: "1st Edition", printing: "English", condition: "Heavily Played", conditionNotes: "Heavy whitening and edge wear with surface marks and corner wear. Review both scans carefully before purchase.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [45], pokemonNames: ["Vileplume"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Jungle", "Rare", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 4.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-02/pa-0021-front.jpg", "Vileplume Jungle 31/64 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-02/pa-0021-back.jpg", "Vileplume Jungle 31/64 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0022", id: "LIVE-011", slug: "seel-neo-destiny-81-105-first-edition", title: "Seel", subtitle: "2002 Neo Destiny 81/105 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Neo Destiny Seel, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Neo Destiny closed the original Neo block and paired light and dark themes with one of the Wizards era's most ambitious set structures.", culturalSignificance: "A first-edition common from the final English Neo expansion, illustrated by Masako Yamashita.",
    year: 2002, approximateYear: false, era: "Neo era · 2002", country: "United States", language: "English", artist: "Masako Yamashita", illustrator: "Masako Yamashita", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Neo Destiny", series: "Neo", cardNumber: "81/105", catalogNumber: "PA-0022", edition: "1st Edition", printing: "English", condition: "Moderately Played", conditionNotes: "Visible reverse-edge whitening, corner wear, and light surface handling. Review both scans for the exact copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [86], pokemonNames: ["Seel"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Destiny", "Common", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 2.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-02/pa-0022-front.jpg", "Seel Neo Destiny 81/105 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-02/pa-0022-back.jpg", "Seel Neo Destiny 81/105 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0023", id: "LIVE-012", slug: "mistys-horsea-gym-challenge-87-132-first-edition", title: "Misty's Horsea", subtitle: "2000 Gym Challenge 87/132 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Gym Challenge Misty's Horsea, individually straightened and cropped from original Pocket Archives front and reverse scanner sheets.", archivalNote: "Gym Challenge deepened the TCG's connection to the games and animation by organizing Pokémon around named trainers and recognizable relationships.", culturalSignificance: "A first-edition trainer-owned Pokémon card using Ken Sugimori artwork during the Wizards era.",
    year: 2000, approximateYear: false, era: "Wizards era · 2000", country: "United States", language: "English", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Gym Challenge", series: "Gym", cardNumber: "87/132", catalogNumber: "PA-0023", edition: "1st Edition", printing: "English", condition: "Damaged", conditionNotes: "Prominent paper loss on the reverse, plus edge whitening, corner wear, and surface handling. The damage is clearly shown in the reverse scan.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 02 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [116], pokemonNames: ["Horsea"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Gym Challenge", "Common", "1st Edition", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-02/pa-0023-front.jpg", "Misty's Horsea Gym Challenge 87/132 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-02/pa-0023-back.jpg", "Misty's Horsea Gym Challenge 87/132 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and back Pocket Archives scanner images from batch 02, position four.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0024", id: "LIVE-013", slug: "tyrogue-town-on-no-map-055-092-first-edition", title: "Tyrogue", subtitle: "2002 The Town on No Map 055/092 · 1st Edition", objectType: "Trading card", category: "Cards",
    description: "A Japanese first-edition Tyrogue from The Town on No Map, individually straightened and cropped from original Pocket Archives front and reverse scans.", archivalNote: "The Town on No Map belongs to Japan's early Pokémon-e period and pairs e-Reader dot-strip technology with a distinct Tomokazu Komiya illustration that differs from the English Aquapolis printing.", culturalSignificance: "A Japanese e-Card-era common connecting Komiya's expressive artwork with the experimental card technology of 2002.",
    year: 2002, approximateYear: false, era: "Pokémon-e era · 2002", country: "Japan", language: "Japanese", artist: "Tomokazu Komiya", illustrator: "Tomokazu Komiya", manufacturer: null, publisher: null, set: "The Town on No Map", series: "Pokémon-e Card Game", cardNumber: "055/092", catalogNumber: "PA-0024", edition: "1st Edition", printing: "Japanese · Normal", condition: "Heavily Played", conditionNotes: "Heavy edge and corner wear on the reverse with widespread whitening, surface scuffing, and handling marks. The front also shows edge and surface wear. No professional grade is claimed.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 03 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [236], pokemonNames: ["Tyrogue"], artistIds: ["tomokazu-komiya"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "The Town on No Map", "Pokémon-e", "1st Edition", "Japanese", "Common", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 9.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-03/pa-0024-front.jpg", "Tyrogue The Town on No Map 055/092 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-03/pa-0024-back.jpg?v=corrected", "Tyrogue The Town on No Map 055/092 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front rescan and reverse Pocket Archives scanner image from batch 03, position one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0025", id: "LIVE-014", slug: "omanyte-ex-sandstorm-70-100", title: "Omanyte", subtitle: "2003 EX Sandstorm 70/100 · Common", objectType: "Trading card", category: "Cards",
    description: "An English EX Sandstorm Omanyte, individually straightened and cropped from original Pocket Archives front and reverse scans.", archivalNote: "EX Sandstorm followed the first Ruby & Sapphire expansion and retained the e-Reader dot strip while adapting early Hoenn-era card design around desert and fossil themes.", culturalSignificance: "A well-used EX-era common illustrated by Kouki Saitou and preserved with its condition shown plainly.",
    year: 2003, approximateYear: false, era: "EX era · 2003", country: "United States", language: "English", artist: "Kouki Saitou", illustrator: "Kouki Saitou", manufacturer: null, publisher: "Nintendo", set: "EX Sandstorm", series: "EX", cardNumber: "70/100", catalogNumber: "PA-0025", edition: null, printing: "English · Normal", condition: "Damaged", conditionNotes: "Multiple visible creases cross the front and reverse, with additional surface scratches, edge whitening, and corner wear. The structural damage is clearly shown in both scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 03 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [138], pokemonNames: ["Omanyte"], artistIds: ["kouki-saitou"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "EX Sandstorm", "EX Era", "Common", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-03/pa-0025-front.jpg", "Omanyte EX Sandstorm 70/100 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-03/pa-0025-back.jpg?v=corrected", "Omanyte EX Sandstorm 70/100 — scanned reverse", "back")], sourceMetadata: "Original front rescan and reverse Pocket Archives scanner image from batch 03, position two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0026", id: "LIVE-015", slug: "treecko-ex-ruby-sapphire-75-109", title: "Treecko", subtitle: "2003 EX Ruby & Sapphire 75/109 · Common", objectType: "Trading card", category: "Cards",
    description: "An English EX Ruby & Sapphire Treecko, individually straightened and cropped from original Pocket Archives front and reverse scans.", archivalNote: "EX Ruby & Sapphire introduced the Hoenn generation to the English TCG and marked the transition from Wizards of the Coast to Nintendo-era publishing while retaining e-Reader compatibility.", culturalSignificance: "An early English Treecko card illustrated by Midori Harada at the beginning of the EX era.",
    year: 2003, approximateYear: false, era: "EX era · 2003", country: "United States", language: "English", artist: "Midori Harada", illustrator: "Midori Harada", manufacturer: null, publisher: "Nintendo", set: "EX Ruby & Sapphire", series: "EX", cardNumber: "75/109", catalogNumber: "PA-0026", edition: null, printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Visible reverse-edge whitening and light corner wear with scattered surface scratches and handling marks on both sides. No crease is clearly visible in the scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 03 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [252], pokemonNames: ["Treecko"], artistIds: ["midori-harada"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "EX Ruby & Sapphire", "EX Era", "Common", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.69, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-03/pa-0026-front.jpg", "Treecko EX Ruby & Sapphire 75/109 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-03/pa-0026-back.jpg?v=corrected", "Treecko EX Ruby & Sapphire 75/109 — scanned reverse", "back")], sourceMetadata: "Original front rescan and reverse Pocket Archives scanner image from batch 03, position three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0027", id: "LIVE-016", slug: "poochyena-ex-ruby-sapphire-63-109", title: "Poochyena", subtitle: "2003 EX Ruby & Sapphire 63/109 · Common", objectType: "Trading card", category: "Cards",
    description: "An English EX Ruby & Sapphire Poochyena, individually straightened and cropped from original Pocket Archives front and reverse scans.", archivalNote: "EX Ruby & Sapphire established the visual language of the Nintendo-era English card game, including e-Reader dot strips and multiple common artworks for several Hoenn Pokémon.", culturalSignificance: "An early Hoenn common using Ken Sugimori's foundational character artwork during the TCG's 2003 transition.",
    year: 2003, approximateYear: false, era: "EX era · 2003", country: "United States", language: "English", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: null, publisher: "Nintendo", set: "EX Ruby & Sapphire", series: "EX", cardNumber: "63/109", catalogNumber: "PA-0027", edition: null, printing: "English · Normal", condition: "Lightly Played", conditionNotes: "Light edge and corner wear with small surface marks and minor reverse whitening. Flatbed scans may not reveal every fine scratch or indentation; review both images for the exact copy.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from four-card batch 03 on 2026-08-15.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-15",
    pokemonIds: [261], pokemonNames: ["Poochyena"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "EX Ruby & Sapphire", "EX Era", "Common", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.69, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-03/pa-0027-front.jpg", "Poochyena EX Ruby & Sapphire 63/109 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-03/pa-0027-back.jpg?v=corrected", "Poochyena EX Ruby & Sapphire 63/109 — scanned reverse", "back")], sourceMetadata: "Original front rescan and reverse Pocket Archives scanner image from batch 03, position four.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0028", id: "LIVE-017", slug: "croconaw-neo-premium-file-1-no-159", title: "Croconaw", subtitle: "1999 Neo Premium File 1 · No.159", objectType: "Trading card", category: "Promos",
    description: "A Japanese Croconaw from Neo Premium File 1, offered as a single card with its original front and reverse scans.", archivalNote: "Neo Premium File 1 introduced the Johto starter families in a nine-card Japanese presentation released alongside Pokémon Gold and Silver.", culturalSignificance: "An early Johto promotional card using Ken Sugimori's foundational Croconaw artwork.",
    year: 1999, approximateYear: false, era: "Neo era · 1999", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: null, publisher: null, set: "Neo Premium File 1", series: "Neo", cardNumber: "No.159", catalogNumber: "PA-0028", edition: null, printing: "Japanese · Old back · Normal", condition: "Moderately Played", conditionNotes: "Moderate reverse-edge whitening and corner wear with visible scratches, scuffs, and handling marks. The front has additional edge and surface wear. No crease is visible in the flatbed scans.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [159], pokemonNames: ["Croconaw"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Premium File 1", "Japanese", "Promo", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 2.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0028-front.jpg", "Croconaw Neo Premium File 1 No.159 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0028-back.jpg", "Croconaw Neo Premium File 1 No.159 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row one column one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0029", id: "LIVE-018", slug: "tentacruel-southern-islands-10-18", title: "Tentacruel", subtitle: "2001 Southern Islands 10/18 · Promo", objectType: "Trading card", category: "Cards",
    description: "An English Southern Islands Tentacruel, offered as a single promotional-set card with its original front and reverse scans.", archivalNote: "Southern Islands was sold as a themed collection rather than a booster expansion, with card illustrations that connect into larger island scenes.", culturalSignificance: "A Wizards-era promotional card illustrated by Naoyo Kimura and preserved in clearly played condition.",
    year: 2001, approximateYear: false, era: "Wizards era · 2001", country: "United States", language: "English", artist: "Naoyo Kimura", illustrator: "Naoyo Kimura", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Southern Islands", series: "Southern Islands", cardNumber: "10/18", catalogNumber: "PA-0029", edition: null, printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderate whitening along the reverse edges and corners, with surface scratches, scuffs, small edge nicks, and front handling wear. No crease is visible in the flatbed scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [73], pokemonNames: ["Tentacruel"], artistIds: ["naoyo-kimura"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Southern Islands", "Promo", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 29.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0029-front.jpg", "Tentacruel Southern Islands 10/18 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0029-back.jpg", "Tentacruel Southern Islands 10/18 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row one column two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0030", id: "LIVE-019", slug: "totodile-neo-premium-file-1-no-158", title: "Totodile", subtitle: "1999 Neo Premium File 1 · No.158", objectType: "Trading card", category: "Promos",
    description: "A Japanese Totodile from Neo Premium File 1, offered as a single card with its original front and reverse scans.", archivalNote: "The nine-card Neo Premium File 1 grouped all three Johto starter evolution lines in one compact release.", culturalSignificance: "An early Japanese Totodile promotional card illustrated by Ken Sugimori.",
    year: 1999, approximateYear: false, era: "Neo era · 1999", country: "Japan", language: "Japanese", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: null, publisher: null, set: "Neo Premium File 1", series: "Neo", cardNumber: "No.158", catalogNumber: "PA-0030", edition: null, printing: "Japanese · Old back · Normal", condition: "Moderately Played", conditionNotes: "Moderate reverse-edge and corner whitening with scratches, scuffs, and small nicks. The front shows scattered surface marks and edge wear. No crease is visible in the flatbed scans.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [158], pokemonNames: ["Totodile"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Premium File 1", "Japanese", "Promo", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 2.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0030-front.jpg", "Totodile Neo Premium File 1 No.158 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0030-back.jpg", "Totodile Neo Premium File 1 No.158 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row one column three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0031", id: "LIVE-020", slug: "magneton-japanese-base-set-no-082-holo", title: "Magneton", subtitle: "1996 Japanese Base Set · No.082 · Holo Rare", objectType: "Trading card", category: "Cards",
    description: "A Japanese Base Set Magneton holo rare with its original old-style reverse, offered with condition shown plainly in the scans.", archivalNote: "Japan's first Pokémon Card Game expansion established the original card frame and the holographic rare treatment later adapted internationally.", culturalSignificance: "An early holographic Magneton illustrated by Keiji Kinebuchi in the first Japanese TCG release.",
    year: 1996, approximateYear: false, era: "Launch era · 1996", country: "Japan", language: "Japanese", artist: "Keiji Kinebuchi", illustrator: "Keiji Kinebuchi", manufacturer: null, publisher: null, set: "Expansion Pack (Japanese Base Set)", series: "Original Japanese series", cardNumber: "No.082", catalogNumber: "PA-0031", edition: null, printing: "Japanese · Old back · Holofoil", condition: "Moderately Played", conditionNotes: "Visible scratches cross the holographic artwork, with moderate reverse-edge whitening, corner wear, scuffs, and handling marks. No crease is visible in the flatbed scans.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [82], pokemonNames: ["Magneton"], artistIds: ["keiji-kinebuchi"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Japanese Base Set", "Holo Rare", "Japanese", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 8.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0031-front.jpg", "Magneton Japanese Base Set No.082 holo — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0031-back.jpg", "Magneton Japanese Base Set No.082 holo — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row two column one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0032", id: "LIVE-021", slug: "ampharos-awakening-legends-no-181-holo", title: "Ampharos", subtitle: "2000 Awakening Legends · No.181 · Holo Rare", objectType: "Trading card", category: "Cards",
    description: "A Japanese Awakening Legends Ampharos holo rare, photographed front and back as the exact card offered.", archivalNote: "Awakening Legends expanded the Japanese Neo era with darker, atmospheric illustration and a distinct set identity later adapted into Neo Revelation.", culturalSignificance: "A Japanese Neo-era holographic Ampharos illustrated by Toshinao Aoki.",
    year: 2000, approximateYear: false, era: "Neo era · 2000", country: "Japan", language: "Japanese", artist: "Toshinao Aoki", illustrator: "Toshinao Aoki", manufacturer: null, publisher: null, set: "Awakening Legends", series: "Neo", cardNumber: "No.181", catalogNumber: "PA-0032", edition: null, printing: "Japanese · Old back · Holofoil", condition: "Moderately Played", conditionNotes: "Visible scratches across the holographic artwork with moderate reverse-edge whitening, corner wear, scuffs, and handling marks. No crease is visible in the flatbed scans.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [181], pokemonNames: ["Ampharos"], artistIds: ["toshinao-aoki"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Awakening Legends", "Holo Rare", "Japanese", "Neo", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 14.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0032-front.jpg", "Ampharos Awakening Legends No.181 holo — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0032-back.jpg", "Ampharos Awakening Legends No.181 holo — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row two column two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0033", id: "LIVE-022", slug: "magby-neo-genesis-23-111", title: "Magby", subtitle: "2000 Neo Genesis 23/111 · Rare", objectType: "Trading card", category: "Cards",
    description: "An English unlimited Neo Genesis Magby rare, offered as a single card with its original front and reverse scans.", archivalNote: "Neo Genesis introduced Baby Pokémon to the English TCG and gave them a distinctive rule box within the original card frame.", culturalSignificance: "An early English Magby card using Ken Sugimori artwork during Pokémon's first generational expansion.",
    year: 2000, approximateYear: false, era: "Neo era · 2000", country: "United States", language: "English", artist: "Ken Sugimori", illustrator: "Ken Sugimori", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Neo Genesis", series: "Neo", cardNumber: "23/111", catalogNumber: "PA-0033", edition: "Unlimited", printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderate reverse-edge whitening and corner wear with scratches and scuffs. The front has visible surface wear and small marks. No crease is visible in the flatbed scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [240], pokemonNames: ["Magby"], artistIds: ["ken-sugimori"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Genesis", "Rare", "Unlimited", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0033-front.jpg", "Magby Neo Genesis 23/111 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0033-back.jpg", "Magby Neo Genesis 23/111 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row two column three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0034", id: "LIVE-023", slug: "kangaskhan-jungle-21-64-unlimited", title: "Kangaskhan", subtitle: "1999 Jungle 21/64 · Unlimited Rare", objectType: "Trading card", category: "Cards",
    description: "An English unlimited Jungle Kangaskhan non-holo rare, offered with original front and reverse scans of the exact card.", archivalNote: "Jungle was the first English expansion beyond Base Set and brought Pokémon habitats more visibly into the card artwork.", culturalSignificance: "A Wizards-era non-holo rare with Mitsuhiro Arita's early Kangaskhan illustration.",
    year: 1999, approximateYear: false, era: "Wizards era · 1999", country: "United States", language: "English", artist: "Mitsuhiro Arita", illustrator: "Mitsuhiro Arita", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Jungle", series: "Wizards of the Coast", cardNumber: "21/64", catalogNumber: "PA-0034", edition: "Unlimited", printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderate reverse-edge and corner whitening with surface scratches, scuffs, and small nicks. The front has visible handling marks and border wear. No crease is visible in the flatbed scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [115], pokemonNames: ["Kangaskhan"], artistIds: ["mitsuhiro-arita"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Jungle", "Rare", "Unlimited", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0034-front.jpg", "Kangaskhan Jungle 21/64 Unlimited — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0034-back.jpg", "Kangaskhan Jungle 21/64 Unlimited — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row three column one.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0035", id: "LIVE-024", slug: "cleffa-japanese-neo-genesis-no-173", title: "Cleffa", subtitle: "2000 Gold, Silver, to a New World… · No.173 Rare", objectType: "Trading card", category: "Cards",
    description: "A Japanese Cleffa rare from Gold, Silver, to a New World…, the Japanese set corresponding to Neo Genesis, shown with its original old-style reverse.", archivalNote: "The first Japanese Neo expansion introduced Baby Pokémon and the Johto generation within the original Pocket Monsters Card Game frame.", culturalSignificance: "A Japanese Neo-era rare illustrated by Kagemaru Himeno.",
    year: 2000, approximateYear: false, era: "Neo era · 2000", country: "Japan", language: "Japanese", artist: "Kagemaru Himeno", illustrator: "Kagemaru Himeno", manufacturer: null, publisher: null, set: "Gold, Silver, to a New World…", series: "Neo", cardNumber: "No.173", catalogNumber: "PA-0035", edition: null, printing: "Japanese · Old back · Normal", condition: "Moderately Played", conditionNotes: "Moderate reverse-edge whitening and corner wear with scratches, scuffs, and small nicks. The front has scattered surface marks and edge wear. No crease is visible in the flatbed scans.", dimensions: "Approx. 63 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [173], pokemonNames: ["Cleffa"], artistIds: ["kagemaru-himeno"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Gold Silver to a New World", "Neo Genesis", "Rare", "Japanese", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0035-front.jpg", "Cleffa Gold, Silver, to a New World No.173 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0035-back.jpg", "Cleffa Gold, Silver, to a New World No.173 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row three column two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0036", id: "LIVE-025", slug: "scizor-wizards-black-star-promo-33", title: "Scizor", subtitle: "2001 Wizards Black Star Promo 33", objectType: "Promo card", category: "Promos",
    description: "An English Wizards Black Star Promo Scizor #33, offered as a single card with original front and reverse scans.", archivalNote: "The Wizards Black Star line carried Pokémon beyond booster packs through leagues, magazines, films, and other public promotions.", culturalSignificance: "A Neo-era Scizor promotional card illustrated by Hironobu Yoshida.",
    year: 2001, approximateYear: false, era: "Wizards era · 2001", country: "United States", language: "English", artist: "Hironobu Yoshida", illustrator: "Hironobu Yoshida", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Wizards Black Star Promos", series: "Black Star Promo", cardNumber: "33", catalogNumber: "PA-0036", edition: null, printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Visible edge and corner wear, especially along the lower front and reverse borders, with scattered scratches, scuffs, and handling marks. No crease is clearly confirmed by the flatbed scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; separated from nine-card batch 04 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [212], pokemonNames: ["Scizor"], artistIds: ["hironobu-yoshida"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Wizards Black Star Promos", "Promo", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 9.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-04/pa-0036-front.jpg", "Scizor Wizards Black Star Promo 33 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-04/pa-0036-back.jpg", "Scizor Wizards Black Star Promo 33 — scanned reverse", "back")], sourceMetadata: "Original front and reverse Pocket Archives scanner images from batch 04, row three column three.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0037", id: "LIVE-026", slug: "vigoroth-ex-ruby-sapphire-47-109", title: "Vigoroth", subtitle: "2003 EX Ruby & Sapphire 47/109 · Uncommon", objectType: "Trading card", category: "Cards",
    description: "An English EX Ruby & Sapphire Vigoroth uncommon, offered as a single card with the submitted front and reverse scans.", archivalNote: "EX Ruby & Sapphire introduced the Hoenn generation to the English card game and retained the e-Reader dot strip during the transition to Nintendo-era publishing.", culturalSignificance: "An early English Vigoroth card illustrated by Kagemaru Himeno.",
    year: 2003, approximateYear: false, era: "EX era · 2003", country: "United States", language: "English", artist: "Kagemaru Himeno", illustrator: "Kagemaru Himeno", manufacturer: null, publisher: "Nintendo", set: "EX Ruby & Sapphire", series: "EX", cardNumber: "47/109", catalogNumber: "PA-0037", edition: null, printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderately Played per owner inspection. The scans show edge and corner wear, reverse whitening, surface scuffs, and handling marks. Fine scratches or indentations may not be fully visible in the scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; submitted as batch 05 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [288], pokemonNames: ["Vigoroth"], artistIds: ["kagemaru-himeno"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "EX Ruby & Sapphire", "EX Era", "Uncommon", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 0.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-05/pa-0037-front.jpg", "Vigoroth EX Ruby & Sapphire 47/109 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-05/pa-0037-back.jpg", "Vigoroth EX Ruby & Sapphire 47/109 — scanned reverse", "back")], sourceMetadata: "Original front and reverse images extracted from the submitted six-page scanner PDF, pages one and two.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0038", id: "LIVE-027", slug: "dark-primeape-team-rocket-43-82-first-edition", title: "Dark Primeape", subtitle: "2000 Team Rocket 43/82 · 1st Edition Uncommon", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Team Rocket Dark Primeape uncommon, offered with the submitted front and reverse scans of the exact card.", archivalNote: "Team Rocket introduced Dark Pokémon to the English card game, pairing alternate evolutions with the set's villain-centered visual identity.", culturalSignificance: "A first-edition Wizards-era uncommon illustrated by Mitsuhiro Arita.",
    year: 2000, approximateYear: false, era: "Wizards era · 2000", country: "United States", language: "English", artist: "Mitsuhiro Arita", illustrator: "Mitsuhiro Arita", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Team Rocket", series: "Original series", cardNumber: "43/82", catalogNumber: "PA-0038", edition: "1st Edition", printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderately Played per owner inspection. Visible edge and corner wear, reverse whitening, surface scuffs, and handling marks are shown in the scans. Fine scratches or indentations may not be fully visible.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; submitted as batch 05 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [57], pokemonNames: ["Primeape"], artistIds: ["mitsuhiro-arita"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Team Rocket", "Dark Pokémon", "1st Edition", "Uncommon", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 3.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-05/pa-0038-front.jpg", "Dark Primeape Team Rocket 43/82 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-05/pa-0038-back.jpg", "Dark Primeape Team Rocket 43/82 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and reverse images extracted from the submitted six-page scanner PDF, pages three and four.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0039", id: "LIVE-028", slug: "light-sunflora-neo-destiny-72-105-first-edition", title: "Light Sunflora", subtitle: "2002 Neo Destiny 72/105 · 1st Edition Common", objectType: "Trading card", category: "Cards",
    description: "An English first-edition Neo Destiny Light Sunflora common, offered as a single card with the submitted front and reverse scans.", archivalNote: "Neo Destiny paired Light and Dark Pokémon in the final English Neo-series expansion, using character alignment as part of the set's visual storytelling.", culturalSignificance: "A first-edition Light Pokémon illustrated by Toshinao Aoki.",
    year: 2002, approximateYear: false, era: "Neo era · 2002", country: "United States", language: "English", artist: "Toshinao Aoki", illustrator: "Toshinao Aoki", manufacturer: "Wizards of the Coast", publisher: "Wizards of the Coast", set: "Neo Destiny", series: "Neo", cardNumber: "72/105", catalogNumber: "PA-0039", edition: "1st Edition", printing: "English · Normal", condition: "Moderately Played", conditionNotes: "Moderately Played per owner inspection. The reverse shows edge and corner whitening with surface scuffs and handling wear; the front has lighter edge and surface wear. Fine scratches or indentations may not be fully visible in the scans.", dimensions: "Approx. 63.5 × 88 mm", provenance: "Owned and scanned by Pocket Archives; submitted as batch 05 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [192], pokemonNames: ["Sunflora"], artistIds: ["toshinao-aoki"], relatedMuseumIds: [], relatedArchiveIds: [], relatedCardIds: [], relatedCollectionIds: [], tags: ["Live Inventory", "Neo Destiny", "Light Pokémon", "1st Edition", "Common", "Vintage", "Singles", "Cards"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 1.49, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-05/pa-0039-front.jpg", "Light Sunflora Neo Destiny 72/105 1st Edition — scanned front", "front"), ownedPhoto("/shop/inventory/batch-05/pa-0039-back.jpg", "Light Sunflora Neo Destiny 72/105 1st Edition — scanned reverse", "back")], sourceMetadata: "Original front and reverse images extracted from the submitted six-page scanner PDF, pages five and six.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
  },
  {
    accessionNumber: "PA-0040", id: "LIVE-029", slug: "wigglytuff-1996-bandai-carddass-green-040", title: "Wigglytuff", subtitle: "1996 Bandai Carddass Green Version · No.040", objectType: "Collectible card", category: "Carddass",
    description: "A Japanese Bandai Carddass Green Version Wigglytuff No.040, offered with the submitted front and patterned reverse scans.", archivalNote: "Bandai's 1996 Pocket Monsters Carddass cards belong to Pokémon's earliest official collectible-card history and were distributed through Carddass vending machines in Japan.", culturalSignificance: "An early non-TCG Wigglytuff card from the first year of Pokémon collecting culture.",
    year: 1996, approximateYear: false, era: "Launch era · 1996", country: "Japan", language: "Japanese", artist: null, illustrator: null, manufacturer: "Bandai", publisher: "Bandai", set: "Bandai Carddass Pocket Monsters", series: "Green Version", cardNumber: "No.040", catalogNumber: "PA-0040", edition: null, printing: "Japanese · Green patterned back", condition: "Near Mint", conditionNotes: "Near Mint per owner inspection. The scans show clean presentation with only minor handling evidence. The period printing and patterned reverse are shown as submitted; no professional grade is claimed.", dimensions: "Approx. 59 × 86 mm", provenance: "Owned and scanned by Pocket Archives; submitted as batch 05 on 2026-08-16.", acquisitionSource: "Pocket Archives founder collection", acquisitionDate: "2026-08-16",
    pokemonIds: [40], pokemonNames: ["Wigglytuff"], artistIds: [], relatedMuseumIds: [], relatedArchiveIds: ["carddass-action-1"], relatedCardIds: [], relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"], tags: ["Live Inventory", "Bandai Carddass", "Green Version", "Japanese", "Vintage", "Original 151", "Singles", "Carddass"], fromArchive: false, physicalOwnership: true, commerceMode: "fixedPrice", recordState: "available", availabilityStatus: "available", price: 10.99, currency: "USD", quantity: 1, reserved: false, soldDate: null, placedInPrivateCollection: false,
    images: [ownedPhoto("/shop/inventory/batch-05/pa-0040-front.jpg", "Wigglytuff Bandai Carddass Green Version No.040 — scanned front", "front"), ownedPhoto("/shop/inventory/batch-05/pa-0040-back.jpg", "Wigglytuff Bandai Carddass Green Version No.040 — scanned reverse", "back")], sourceMetadata: "Original front and reverse images extracted from the submitted two-page scanner PDF.", rightsMetadata: "Original Pocket Archives inventory scan.", featured: true, demo: false,
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

export const SHOP_ORIGIN = "https://pocketarchives.com";
export const SHOP_HOME = "/shop";
export const EXTERNAL_SHOP_URL = "https://www.ebay.com/usr/pocket_archives";
export const ARCHIVE_ORIGIN = "https://pocketarchives.com";

export function shopObjectUrl(slug: string) { return `/objects/${slug}`; }
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
