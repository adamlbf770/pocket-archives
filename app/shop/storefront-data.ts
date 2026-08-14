import { demoInventory, type InventoryItem } from "./catalog";

export type CollectionType = "editorial" | "curatedSet" | "complete" | "open";
export type CopyAllocationMode = "single" | "collection" | "auction" | "privateSale" | "archive" | "sold";
export type PresentationOptionId = "raw" | "sleeve" | "capsule" | "binder" | "curatedSet" | "custom";

export type CatalogItem = {
  id: string;
  title: string;
  objectType: string;
  set: string | null;
  catalogNumber: string | null;
  year: number | null;
  artist: string | null;
};

export type PhysicalCopy = {
  id: string;
  catalogItemId: string;
  publicObjectId: string;
  condition: string;
  acquisitionCost: number | null;
  acquisitionSource: string | null;
  allocation: { mode: CopyAllocationMode; referenceId: string | null };
  presentation: PresentationOptionId;
  imageIds: string[];
  storageLocation: string;
  saleState: "available" | "held" | "reserved" | "sold";
  ownedByPocketArchives: boolean;
  consigned: boolean;
  consignorId: string | null;
  agreementStatus: "not-applicable" | "draft" | "active" | "closed";
  commissionRate: number | null;
  minimumNet: number | null;
  reserve: number | null;
  insuranceValue: number | null;
  intakeDate: string | null;
  returnDate: string | null;
  payoutStatus: "not-applicable" | "pending" | "paid";
  demo: true;
};

export type PresentationOption = {
  id: PresentationOptionId;
  label: string;
  description: string;
  priceAdjustment: number;
  available: boolean;
  requiredQuantity: number;
  packagingType: string;
};

export type StoreCollectionMember = {
  id: string;
  label: string;
  image: string;
  publicObjectId: string | null;
  physicalCopyIds: string[];
  status: "In Pocket Archives" | "Available" | "In Collection" | "Sold" | "Not currently held";
};

export type StoreCollection = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  curatorNote: string;
  type: CollectionType;
  category: "Artists" | "Illustration Styles" | "Characters" | "Eras" | "Visual Themes" | "Pocket Archives Editions";
  era: string;
  heroImages: string[];
  memberIds: string[];
  physicalCopyIds: string[];
  relatedArchiveIds: string[];
  presentationOptionIds: PresentationOptionId[];
  price: number | null;
  demo: true;
};

export type BinderProduct = {
  id: string;
  title: string;
  volume: string;
  physicalCopyIds: string[];
  binderDesignVersion: string;
  collectionId: string;
  editionNumber: number | null;
  packaging: string;
  totalPrice: number;
  demo: true;
};

export type ArtistProgramProfile = {
  id: string;
  name: string;
  status: "future" | "invited" | "active";
  originalWorkOnly: boolean;
  licensedWorkRequired: boolean;
  mediums: string[];
};

const object = (id: string) => demoInventory.find((item) => item.id === id)!;

export const catalogItems: CatalogItem[] = [
  { id: "CAT-BULBASAUR-BASE", title: "Base Set Bulbasaur 44/102", objectType: "Trading card", set: "Base Set", catalogNumber: "44/102", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-HAUNTER-FOSSIL", title: "Fossil Haunter 21/62", objectType: "Trading card", set: "Fossil", catalogNumber: "21/62", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-PIKACHU-PROMO", title: "Pikachu Black Star Promo 1", objectType: "Promo card", set: "Wizards Black Star Promos", catalogNumber: "1", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-MEW-PROMO", title: "Mew Black Star Promo 9", objectType: "Promo card", set: "Wizards Black Star Promos", catalogNumber: "9", year: 2000, artist: "Ken Sugimori" },
  { id: "CAT-CHARMANDER-BASE", title: "Base Set Charmander 46/102", objectType: "Trading card", set: "Base Set", catalogNumber: "46/102", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-SQUIRTLE-BASE", title: "Base Set Squirtle 63/102", objectType: "Trading card", set: "Base Set", catalogNumber: "63/102", year: 1999, artist: "Mitsuhiro Arita" },
];

function copy(id: number, catalogItemId: string, publicObjectId: string, mode: CopyAllocationMode, referenceId: string | null, presentation: PresentationOptionId = "sleeve"): PhysicalCopy {
  return {
    id: `PA-COPY-${String(id).padStart(6, "0")}`,
    catalogItemId,
    publicObjectId,
    condition: object(publicObjectId).condition,
    acquisitionCost: null,
    acquisitionSource: "Demonstration intake",
    allocation: { mode, referenceId },
    presentation,
    imageIds: object(publicObjectId).images.map((image) => image.src),
    storageLocation: "Demo cabinet",
    saleState: mode === "archive" ? "held" : "available",
    ownedByPocketArchives: true,
    consigned: false,
    consignorId: null,
    agreementStatus: "not-applicable",
    commissionRate: null,
    minimumNet: null,
    reserve: null,
    insuranceValue: null,
    intakeDate: "2026-08-14",
    returnDate: null,
    payoutStatus: "not-applicable",
    demo: true,
  };
}

// Every ID below occurs once and has exactly one current allocation.
export const physicalCopies: PhysicalCopy[] = [
  copy(1, "CAT-BULBASAUR-BASE", "DEMO-001", "single", "binder"),
  copy(2, "CAT-HAUNTER-FOSSIL", "DEMO-002", "privateSale", "private-room"),
  copy(3, "CAT-PIKACHU-PROMO", "DEMO-003", "single", "binder"),
  copy(4, "CAT-MEW-PROMO", "DEMO-004", "single", "gallery"),
  copy(5, "CAT-BULBASAUR-BASE", "DEMO-005", "collection", "base-set-starters", "binder"),
  copy(6, "CAT-CHARMANDER-BASE", "DEMO-005", "collection", "base-set-starters", "binder"),
  copy(7, "CAT-SQUIRTLE-BASE", "DEMO-005", "collection", "base-set-starters", "binder"),
  copy(8, "CAT-BULBASAUR-BASE", "DEMO-006", "collection", "the-sugimori-archive", "curatedSet"),
  copy(9, "CAT-HAUNTER-FOSSIL", "DEMO-006", "collection", "the-sugimori-archive", "curatedSet"),
  copy(10, "CAT-PIKACHU-PROMO", "DEMO-007", "collection", "black-star-studies", "curatedSet"),
  copy(11, "CAT-MEW-PROMO", "DEMO-007", "collection", "black-star-studies", "curatedSet"),
];

export const presentationOptions: PresentationOption[] = [
  { id: "raw", label: "Object only", description: "The object as catalogued, without an added Pocket Archives presentation.", priceAdjustment: 0, available: true, requiredQuantity: 1, packagingType: "Protective shipping sleeve" },
  { id: "sleeve", label: "Archive Sleeve", description: "Archival-safe sleeve with a restrained Pocket Archives record label.", priceAdjustment: 4, available: true, requiredQuantity: 1, packagingType: "Archival sleeve" },
  { id: "capsule", label: "Pocket Archives Capsule", description: "Reusable slab-style holder with accession label and QR link. Presentation only—no grade or authentication claim.", priceAdjustment: 18, available: true, requiredQuantity: 1, packagingType: "Reusable capsule" },
  { id: "binder", label: "Pocket Archives Binder", description: "Placed into an archival binder page with a catalog label and digital collection link.", priceAdjustment: 24, available: true, requiredQuantity: 1, packagingType: "Archival binder page" },
  { id: "curatedSet", label: "Collection Presentation", description: "Binder, title page, curator note, object list, and QR link for a multi-object collection.", priceAdjustment: 42, available: true, requiredQuantity: 2, packagingType: "Curated collection binder" },
  { id: "custom", label: "Custom Presentation", description: "A future presentation configured for a specific object or commissioned collection.", priceAdjustment: 0, available: false, requiredQuantity: 1, packagingType: "Custom" },
];

export const collectionMembers: StoreCollectionMember[] = [
  { id: "MEM-BULBASAUR", label: "Bulbasaur · Base Set", image: "/shop/cards/bulbasaur-base.png", publicObjectId: "DEMO-001", physicalCopyIds: ["PA-COPY-000001"], status: "Available" },
  { id: "MEM-HAUNTER", label: "Haunter · Fossil", image: "/shop/cards/haunter-fossil.png", publicObjectId: "DEMO-002", physicalCopyIds: ["PA-COPY-000002"], status: "In Pocket Archives" },
  { id: "MEM-PIKACHU", label: "Pikachu · Black Star Promo", image: "/shop/cards/pikachu-promo.png", publicObjectId: "DEMO-003", physicalCopyIds: ["PA-COPY-000003"], status: "Available" },
  { id: "MEM-MEW", label: "Mew · Black Star Promo", image: "/shop/cards/mew-promo.png", publicObjectId: "DEMO-004", physicalCopyIds: ["PA-COPY-000004"], status: "In Pocket Archives" },
  { id: "MEM-SUGIMORI-B", label: "Bulbasaur · Sugimori study", image: "/shop/cards/bulbasaur-base.png", publicObjectId: "DEMO-006", physicalCopyIds: ["PA-COPY-000008"], status: "In Collection" },
  { id: "MEM-SUGIMORI-H", label: "Haunter · Sugimori study", image: "/shop/cards/haunter-fossil.png", publicObjectId: "DEMO-006", physicalCopyIds: ["PA-COPY-000009"], status: "In Collection" },
  { id: "MEM-BLACKSTAR-P", label: "Pikachu · Black Star Promo", image: "/shop/cards/pikachu-promo.png", publicObjectId: "DEMO-007", physicalCopyIds: ["PA-COPY-000010"], status: "In Collection" },
  { id: "MEM-BLACKSTAR-M", label: "Mew · Black Star Promo", image: "/shop/cards/mew-promo.png", publicObjectId: "DEMO-007", physicalCopyIds: ["PA-COPY-000011"], status: "In Collection" },
  { id: "MEM-STARTER-B", label: "Bulbasaur · Base Set", image: "/shop/cards/bulbasaur-base.png", publicObjectId: "DEMO-005", physicalCopyIds: ["PA-COPY-000005"], status: "In Collection" },
  { id: "MEM-STARTER-C", label: "Charmander · Base Set", image: "/shop/cards/charmander-base.png", publicObjectId: "DEMO-005", physicalCopyIds: ["PA-COPY-000006"], status: "In Collection" },
  { id: "MEM-STARTER-S", label: "Squirtle · Base Set", image: "/shop/cards/squirtle-base.png", publicObjectId: "DEMO-005", physicalCopyIds: ["PA-COPY-000007"], status: "In Collection" },
  { id: "MEM-GASTLY", label: "Gastly · Artist study", image: "/shop/cards/haunter-fossil.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-GENGAR", label: "Gengar · Artist study", image: "/shop/cards/haunter-fossil.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
];

export const storeCollections: StoreCollection[] = [
  { id: "STORE-COL-001", slug: "the-sugimori-archive", title: "The Sugimori Archive", subtitle: "Foundational silhouettes and a world drawn into focus.", description: "An editorial collection connecting early character art, promotional cards, and the visual economy that made Pokémon readable at every scale.", curatorNote: "The point is not to complete a conventional set. It is to notice how posture, outline, and restraint created characters that could survive a Game Boy screen, a card, and a global visual culture.", type: "editorial", category: "Artists", era: "1996–2000", heroImages: ["/shop/cards/bulbasaur-base.png", "/shop/cards/haunter-fossil.png", "/shop/cards/pikachu-promo.png"], memberIds: ["MEM-SUGIMORI-B", "MEM-SUGIMORI-H", "MEM-PIKACHU", "MEM-MEW"], physicalCopyIds: ["PA-COPY-000008", "PA-COPY-000009"], relatedArchiveIds: ["public-visual-identity"], presentationOptionIds: ["sleeve", "capsule", "curatedSet"], price: null, demo: true },
  { id: "STORE-COL-002", slug: "base-set-starters", title: "Base Set Starters", subtitle: "Three beginnings, kept together.", description: "A selected three-card set of the original partners as they appeared in the 1999 English Base Set.", curatorNote: "A familiar trio becomes more interesting when treated as one designed entry point: three types, three temperaments, and three equally memorable first choices.", type: "curatedSet", category: "Characters", era: "1999", heroImages: ["/shop/cards/bulbasaur-base.png", "/shop/cards/charmander-base.png", "/shop/cards/squirtle-base.png"], memberIds: ["MEM-STARTER-B", "MEM-STARTER-C", "MEM-STARTER-S"], physicalCopyIds: ["PA-COPY-000005", "PA-COPY-000006", "PA-COPY-000007"], relatedArchiveIds: ["public-visual-identity"], presentationOptionIds: ["binder", "curatedSet"], price: 72, demo: true },
  { id: "STORE-COL-003", slug: "kanto-ghosts", title: "Kanto Ghosts", subtitle: "A family built from atmosphere and silhouette.", description: "An open collecting guide for Gastly, Haunter, and Gengar objects selected for mood, graphic shape, and unusual illustration choices.", curatorNote: "This collection can grow without becoming a checklist of every printing. Each addition has to contribute a new visual idea.", type: "open", category: "Visual Themes", era: "1996–present", heroImages: ["/shop/cards/haunter-fossil.png"], memberIds: ["MEM-GASTLY", "MEM-HAUNTER", "MEM-GENGAR"], physicalCopyIds: [], relatedArchiveIds: [], presentationOptionIds: ["sleeve", "capsule", "binder"], price: null, demo: true },
  { id: "STORE-COL-004", slug: "black-star-studies", title: "Black Star Studies", subtitle: "Early promotional images beyond the booster pack.", description: "A small curated pairing of Pikachu and Mew promotional cards, selected as two different expressions of Pokémon’s early public identity.", curatorNote: "Mascot and mystery: one immediately recognizable, one deliberately elusive.", type: "curatedSet", category: "Eras", era: "1999–2000", heroImages: ["/shop/cards/pikachu-promo.png", "/shop/cards/mew-promo.png"], memberIds: ["MEM-BLACKSTAR-P", "MEM-BLACKSTAR-M"], physicalCopyIds: ["PA-COPY-000010", "PA-COPY-000011"], relatedArchiveIds: [], presentationOptionIds: ["sleeve", "capsule", "curatedSet"], price: 65, demo: true },
];

export const binderProducts: BinderProduct[] = [
  { id: "BINDER-DEMO-001", title: "Base Set Starters", volume: "Volume I", physicalCopyIds: ["PA-COPY-000005", "PA-COPY-000006", "PA-COPY-000007"], binderDesignVersion: "PA-BINDER-01", collectionId: "STORE-COL-002", editionNumber: null, packaging: "Archival binder, title page, curator note, numbered positions, and QR record", totalPrice: 114, demo: true },
];

export const futureArtistProgram: ArtistProgramProfile[] = [
  { id: "ARTIST-PROGRAM-PLACEHOLDER", name: "Artists at Pocket Archives", status: "future", originalWorkOnly: true, licensedWorkRequired: true, mediums: ["Original drawing", "Painting", "Print", "Independent card art", "Custom collectible"] },
];

export const galleryObjectIds = ["DEMO-004", "DEMO-005", "DEMO-006", "DEMO-002"];
export const binderObjectIds = ["DEMO-001", "DEMO-003"];
export const privateSaleObjectIds = ["DEMO-002"];

export function collectionBySlug(slug: string) { return storeCollections.find((collection) => collection.slug === slug); }
export function membersForCollection(collection: StoreCollection) { return collection.memberIds.map((id) => collectionMembers.find((member) => member.id === id)).filter(Boolean) as StoreCollectionMember[]; }
export function copiesForObject(objectId: string) { return physicalCopies.filter((copy) => copy.publicObjectId === objectId); }
export function presentationOptionsForObject(item: InventoryItem) {
  const allowed = item.category === "Curated Collections" ? ["binder", "curatedSet"] : ["raw", "sleeve", "capsule"];
  return presentationOptions.filter((option) => allowed.includes(option.id) && option.available);
}
export function collectionTypeLabel(type: CollectionType) {
  if (type === "curatedSet") return "Curated Set";
  if (type === "complete") return "Complete Collection";
  if (type === "open") return "Open Collection";
  return "Editorial Collection";
}
