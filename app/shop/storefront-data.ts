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
  { id: "CAT-GIRAFARIG-NEO", title: "Neo Genesis Girafarig 58/111", objectType: "Trading card", set: "Neo Genesis", catalogNumber: "58/111", year: 2000, artist: "Ken Sugimori" },
  { id: "CAT-MARILL-EXPEDITION", title: "Expedition Marill 120/165", objectType: "Trading card", set: "Expedition Base Set", catalogNumber: "120/165", year: 2002, artist: "Satoshi Ohta" },
  { id: "CAT-HYPNO-CARDDASS", title: "Pocket Monsters Carddass Hypno File No.097", objectType: "Collectible card", set: "Pocket Monsters Carddass", catalogNumber: "097", year: 1997, artist: null },
  { id: "CAT-SLOWBRO-CARDDASS", title: "Pocket Monsters Carddass Slowbro File No.080", objectType: "Collectible card", set: "Pocket Monsters Carddass", catalogNumber: "080", year: 1997, artist: null },
  { id: "CAT-DELIBIRD-ME", title: "Mega Evolution Delibird 152/132", objectType: "Trading card", set: "Mega Evolution", catalogNumber: "152/132", year: 2025, artist: "Takeshi Nakamura" },
  { id: "CAT-DOUBLADE-PO", title: "Perfect Order Doublade 098/088", objectType: "Trading card", set: "Perfect Order", catalogNumber: "098/088", year: 2026, artist: "Anesaki Dynamic" },
  { id: "CAT-HELIOLISK-AH", title: "Ascended Heroes Heliolisk 229/217", objectType: "Trading card", set: "Ascended Heroes", catalogNumber: "229/217", year: 2026, artist: "SVLT" },
  { id: "CAT-ZARUDE-M5", title: "M5: Abyss Eye Zarude 090/081", objectType: "Trading card", set: "M5: Abyss Eye", catalogNumber: "090/081", year: 2026, artist: "Matazo" },
  { id: "CAT-LEDYBA-NG", title: "Neo Genesis Ledyba 63/111 1st Edition", objectType: "Trading card", set: "Neo Genesis", catalogNumber: "63/111", year: 2000, artist: "Sumiyoshi Kizuki" },
  { id: "CAT-VILEPLUME-JUNGLE", title: "Jungle Vileplume 31/64 1st Edition", objectType: "Trading card", set: "Jungle", catalogNumber: "31/64", year: 1999, artist: "Keiji Kinebuchi" },
  { id: "CAT-SEEL-ND", title: "Neo Destiny Seel 81/105 1st Edition", objectType: "Trading card", set: "Neo Destiny", catalogNumber: "81/105", year: 2002, artist: "Masako Yamashita" },
  { id: "CAT-MISTYS-HORSEA-GC", title: "Gym Challenge Misty's Horsea 87/132 1st Edition", objectType: "Trading card", set: "Gym Challenge", catalogNumber: "87/132", year: 2000, artist: "Ken Sugimori" },
  { id: "CAT-TYROGUE-TOWN", title: "The Town on No Map Tyrogue 055/092 1st Edition", objectType: "Trading card", set: "The Town on No Map", catalogNumber: "055/092", year: 2002, artist: "Tomokazu Komiya" },
  { id: "CAT-OMANYTE-SANDSTORM", title: "EX Sandstorm Omanyte 70/100", objectType: "Trading card", set: "EX Sandstorm", catalogNumber: "70/100", year: 2003, artist: "Kouki Saitou" },
  { id: "CAT-TREECKO-RS", title: "EX Ruby & Sapphire Treecko 75/109", objectType: "Trading card", set: "EX Ruby & Sapphire", catalogNumber: "75/109", year: 2003, artist: "Midori Harada" },
  { id: "CAT-POOCHYENA-RS", title: "EX Ruby & Sapphire Poochyena 63/109", objectType: "Trading card", set: "EX Ruby & Sapphire", catalogNumber: "63/109", year: 2003, artist: "Ken Sugimori" },
  { id: "CAT-CROCONAW-NPF1", title: "Neo Premium File 1 Croconaw No.159", objectType: "Promo card", set: "Neo Premium File 1", catalogNumber: "No.159", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-TENTACRUEL-SI", title: "Southern Islands Tentacruel 10/18", objectType: "Trading card", set: "Southern Islands", catalogNumber: "10/18", year: 2001, artist: "Naoyo Kimura" },
  { id: "CAT-TOTODILE-NPF1", title: "Neo Premium File 1 Totodile No.158", objectType: "Promo card", set: "Neo Premium File 1", catalogNumber: "No.158", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-MAGNETON-JP-BASE", title: "Japanese Expansion Pack Magneton No.082", objectType: "Trading card", set: "Expansion Pack", catalogNumber: "No.082", year: 1996, artist: "Keiji Kinebuchi" },
  { id: "CAT-AMPHAROS-AWAKENING", title: "Awakening Legends Ampharos No.181", objectType: "Trading card", set: "Awakening Legends", catalogNumber: "No.181", year: 2000, artist: "Toshinao Aoki" },
  { id: "CAT-MAGBY-NG", title: "Neo Genesis Magby 23/111", objectType: "Trading card", set: "Neo Genesis", catalogNumber: "23/111", year: 2000, artist: "Ken Sugimori" },
  { id: "CAT-KANGASKHAN-JUNGLE", title: "Jungle Kangaskhan 21/64", objectType: "Trading card", set: "Jungle", catalogNumber: "21/64", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-CLEFFA-JP-NEO", title: "Gold, Silver, to a New World Cleffa No.173", objectType: "Trading card", set: "Gold, Silver, to a New World…", catalogNumber: "No.173", year: 2000, artist: "Kagemaru Himeno" },
  { id: "CAT-SCIZOR-PROMO-33", title: "Scizor Wizards Black Star Promo 33", objectType: "Promo card", set: "Wizards Black Star Promos", catalogNumber: "33", year: 2001, artist: "Hironobu Yoshida" },
  { id: "CAT-BULBASAUR-BASE", title: "Base Set Bulbasaur 44/102", objectType: "Trading card", set: "Base Set", catalogNumber: "44/102", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-HAUNTER-FOSSIL", title: "Fossil Haunter 21/62", objectType: "Trading card", set: "Fossil", catalogNumber: "21/62", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-PIKACHU-PROMO", title: "Pikachu Black Star Promo 1", objectType: "Promo card", set: "Wizards Black Star Promos", catalogNumber: "1", year: 1999, artist: "Ken Sugimori" },
  { id: "CAT-MEW-PROMO", title: "Mew Black Star Promo 9", objectType: "Promo card", set: "Wizards Black Star Promos", catalogNumber: "9", year: 2000, artist: "Ken Sugimori" },
  { id: "CAT-CHARMANDER-BASE", title: "Base Set Charmander 46/102", objectType: "Trading card", set: "Base Set", catalogNumber: "46/102", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-SQUIRTLE-BASE", title: "Base Set Squirtle 63/102", objectType: "Trading card", set: "Base Set", catalogNumber: "63/102", year: 1999, artist: "Mitsuhiro Arita" },
  { id: "CAT-CARDDASS-PIKACHU", title: "Carddass Pikachu 025", objectType: "Collectible card", set: "Pokémon Carddass Part 1 & 2", catalogNumber: "025", year: 1996, artist: "Ken Sugimori" },
  { id: "CAT-CARDDASS-CHARMANDER", title: "Carddass Charmander 004", objectType: "Collectible card", set: "Pokémon Carddass Part 1 & 2", catalogNumber: "004", year: 1996, artist: "Ken Sugimori" },
  { id: "CAT-MEIJI-MEWTWO", title: "Meiji Get Card Mewtwo 150", objectType: "Snack premium card", set: "Pokémon Get Cards", catalogNumber: "150", year: 1997, artist: null },
  { id: "CAT-MEIJI-CHARIZARD", title: "Meiji Get Card Charizard 006", objectType: "Snack premium card", set: "Pokémon Get Cards", catalogNumber: "006", year: 1997, artist: null },
];

function copy(id: number, catalogItemId: string, publicObjectId: string, mode: CopyAllocationMode, referenceId: string | null, presentation: PresentationOptionId = "raw"): PhysicalCopy {
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
  {
    id: "PA-COPY-000016",
    catalogItemId: "CAT-GIRAFARIG-NEO",
    publicObjectId: "LIVE-001",
    condition: object("LIVE-001").condition,
    acquisitionCost: null,
    acquisitionSource: "Pocket Archives founder collection",
    allocation: { mode: "single", referenceId: null },
    presentation: "raw",
    imageIds: object("LIVE-001").images.map((image) => image.src),
    storageLocation: "Pocket Archives inventory",
    saleState: "available",
    ownedByPocketArchives: true,
    consigned: false,
    consignorId: null,
    agreementStatus: "not-applicable",
    commissionRate: null,
    minimumNet: null,
    reserve: null,
    insuranceValue: null,
    intakeDate: "2026-08-15",
    returnDate: null,
    payoutStatus: "not-applicable",
    demo: false,
  },
  {
    id: "PA-COPY-000017",
    catalogItemId: "CAT-MARILL-EXPEDITION",
    publicObjectId: "LIVE-002",
    condition: object("LIVE-002").condition,
    acquisitionCost: null,
    acquisitionSource: "Pocket Archives founder collection",
    allocation: { mode: "single", referenceId: null },
    presentation: "raw",
    imageIds: object("LIVE-002").images.map((image) => image.src),
    storageLocation: "Pocket Archives inventory",
    saleState: "available",
    ownedByPocketArchives: true,
    consigned: false,
    consignorId: null,
    agreementStatus: "not-applicable",
    commissionRate: null,
    minimumNet: null,
    reserve: null,
    insuranceValue: null,
    intakeDate: "2026-08-15",
    returnDate: null,
    payoutStatus: "not-applicable",
    demo: false,
  },
  {
    id: "PA-COPY-000018",
    catalogItemId: "CAT-HYPNO-CARDDASS",
    publicObjectId: "LIVE-003",
    condition: object("LIVE-003").condition,
    acquisitionCost: null,
    acquisitionSource: "Pocket Archives founder collection",
    allocation: { mode: "single", referenceId: null },
    presentation: "raw",
    imageIds: object("LIVE-003").images.map((image) => image.src),
    storageLocation: "Pocket Archives inventory",
    saleState: "available",
    ownedByPocketArchives: true,
    consigned: false,
    consignorId: null,
    agreementStatus: "not-applicable",
    commissionRate: null,
    minimumNet: null,
    reserve: null,
    insuranceValue: null,
    intakeDate: "2026-08-15",
    returnDate: null,
    payoutStatus: "not-applicable",
    demo: false,
  },
  {
    id: "PA-COPY-000019",
    catalogItemId: "CAT-SLOWBRO-CARDDASS",
    publicObjectId: "LIVE-004",
    condition: object("LIVE-004").condition,
    acquisitionCost: null,
    acquisitionSource: "Pocket Archives founder collection",
    allocation: { mode: "single", referenceId: null },
    presentation: "raw",
    imageIds: object("LIVE-004").images.map((image) => image.src),
    storageLocation: "Pocket Archives inventory",
    saleState: "available",
    ownedByPocketArchives: true,
    consigned: false,
    consignorId: null,
    agreementStatus: "not-applicable",
    commissionRate: null,
    minimumNet: null,
    reserve: null,
    insuranceValue: null,
    intakeDate: "2026-08-15",
    returnDate: null,
    payoutStatus: "not-applicable",
    demo: false,
  },
  { id: "PA-COPY-000020", catalogItemId: "CAT-DELIBIRD-ME", publicObjectId: "LIVE-005", condition: object("LIVE-005").condition, acquisitionCost: null, acquisitionSource: "Pocket_Archives eBay inventory", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-005").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000021", catalogItemId: "CAT-DOUBLADE-PO", publicObjectId: "LIVE-006", condition: object("LIVE-006").condition, acquisitionCost: null, acquisitionSource: "Pocket_Archives eBay inventory", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-006").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000022", catalogItemId: "CAT-HELIOLISK-AH", publicObjectId: "LIVE-007", condition: object("LIVE-007").condition, acquisitionCost: null, acquisitionSource: "Pocket_Archives eBay inventory", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-007").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000023", catalogItemId: "CAT-ZARUDE-M5", publicObjectId: "LIVE-008", condition: object("LIVE-008").condition, acquisitionCost: null, acquisitionSource: "Pocket_Archives eBay inventory", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-008").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000024", catalogItemId: "CAT-LEDYBA-NG", publicObjectId: "LIVE-009", condition: object("LIVE-009").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-009").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000025", catalogItemId: "CAT-VILEPLUME-JUNGLE", publicObjectId: "LIVE-010", condition: object("LIVE-010").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-010").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000026", catalogItemId: "CAT-SEEL-ND", publicObjectId: "LIVE-011", condition: object("LIVE-011").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-011").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000027", catalogItemId: "CAT-MISTYS-HORSEA-GC", publicObjectId: "LIVE-012", condition: object("LIVE-012").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-012").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000028", catalogItemId: "CAT-TYROGUE-TOWN", publicObjectId: "LIVE-013", condition: object("LIVE-013").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-013").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000029", catalogItemId: "CAT-OMANYTE-SANDSTORM", publicObjectId: "LIVE-014", condition: object("LIVE-014").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-014").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000030", catalogItemId: "CAT-TREECKO-RS", publicObjectId: "LIVE-015", condition: object("LIVE-015").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-015").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000031", catalogItemId: "CAT-POOCHYENA-RS", publicObjectId: "LIVE-016", condition: object("LIVE-016").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-016").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-15", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000032", catalogItemId: "CAT-CROCONAW-NPF1", publicObjectId: "LIVE-017", condition: object("LIVE-017").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-017").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000033", catalogItemId: "CAT-TENTACRUEL-SI", publicObjectId: "LIVE-018", condition: object("LIVE-018").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-018").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000034", catalogItemId: "CAT-TOTODILE-NPF1", publicObjectId: "LIVE-019", condition: object("LIVE-019").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-019").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000035", catalogItemId: "CAT-MAGNETON-JP-BASE", publicObjectId: "LIVE-020", condition: object("LIVE-020").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-020").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000036", catalogItemId: "CAT-AMPHAROS-AWAKENING", publicObjectId: "LIVE-021", condition: object("LIVE-021").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-021").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000037", catalogItemId: "CAT-MAGBY-NG", publicObjectId: "LIVE-022", condition: object("LIVE-022").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-022").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000038", catalogItemId: "CAT-KANGASKHAN-JUNGLE", publicObjectId: "LIVE-023", condition: object("LIVE-023").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-023").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000039", catalogItemId: "CAT-CLEFFA-JP-NEO", publicObjectId: "LIVE-024", condition: object("LIVE-024").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-024").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
  { id: "PA-COPY-000040", catalogItemId: "CAT-SCIZOR-PROMO-33", publicObjectId: "LIVE-025", condition: object("LIVE-025").condition, acquisitionCost: null, acquisitionSource: "Pocket Archives founder collection", allocation: { mode: "single", referenceId: null }, presentation: "raw", imageIds: object("LIVE-025").images.map((image) => image.src), storageLocation: "Pocket Archives inventory", saleState: "available", ownedByPocketArchives: true, consigned: false, consignorId: null, agreementStatus: "not-applicable", commissionRate: null, minimumNet: null, reserve: null, insuranceValue: null, intakeDate: "2026-08-16", returnDate: null, payoutStatus: "not-applicable", demo: false },
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
  copy(12, "CAT-CARDDASS-PIKACHU", "DEMO-008", "single", "binder"),
  copy(13, "CAT-CARDDASS-CHARMANDER", "DEMO-009", "single", "binder"),
  copy(14, "CAT-MEIJI-MEWTWO", "DEMO-010", "single", "binder"),
  copy(15, "CAT-MEIJI-CHARIZARD", "DEMO-011", "single", "binder"),
];

export const presentationOptions: PresentationOption[] = [
  { id: "raw", label: "Piece only", description: "The card or collectible as listed, without an added Pocket Archives presentation.", priceAdjustment: 0, available: true, requiredQuantity: 1, packagingType: "Card or collectible only" },
  { id: "sleeve", label: "Archive Sleeve", description: "Archival-safe sleeve with a restrained Pocket Archives record label.", priceAdjustment: 4, available: false, requiredQuantity: 1, packagingType: "Archival sleeve" },
  { id: "capsule", label: "Pocket Archives Capsule", description: "Reusable slab-style holder with accession label and QR link. Presentation only—no grade or authentication claim.", priceAdjustment: 18, available: false, requiredQuantity: 1, packagingType: "Reusable capsule" },
  { id: "binder", label: "Pocket Archives Binder", description: "Placed into an archival binder page with a catalog label and digital collection link.", priceAdjustment: 24, available: true, requiredQuantity: 1, packagingType: "Archival binder page" },
  { id: "curatedSet", label: "Collection Presentation", description: "Binder, title page, curator note, piece list, and QR link for a multi-piece collection.", priceAdjustment: 42, available: true, requiredQuantity: 2, packagingType: "Curated collection binder" },
  { id: "custom", label: "Custom Presentation", description: "A future presentation configured for a specific piece or commissioned collection.", priceAdjustment: 0, available: false, requiredQuantity: 1, packagingType: "Custom" },
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
  { id: "MEM-GASTLY", label: "Gastly · Fossil 33/62", image: "/shop/cards/gastly-fossil.png", publicObjectId: null, physicalCopyIds: [], status: "Collection reference" },
  { id: "MEM-GENGAR", label: "Gengar · Fossil 5/62", image: "/shop/cards/gengar-fossil.png", publicObjectId: null, physicalCopyIds: [], status: "Collection reference" },
  { id: "MEM-CARDDASS-P", label: "Pikachu · 1996 Carddass", image: "/shop/cards/carddass-pikachu.jpg", publicObjectId: "DEMO-008", physicalCopyIds: ["PA-COPY-000012"], status: "Available" },
  { id: "MEM-CARDDASS-C", label: "Charmander · 1996 Carddass", image: "/shop/cards/carddass-charmander.jpg", publicObjectId: "DEMO-009", physicalCopyIds: ["PA-COPY-000013"], status: "Available" },
  { id: "MEM-MEIJI-M", label: "Mewtwo · 1997 Meiji Get Card", image: "/shop/cards/meiji-1997-mewtwo.jpeg", publicObjectId: "DEMO-010", physicalCopyIds: ["PA-COPY-000014"], status: "Available" },
  { id: "MEM-MEIJI-C", label: "Charizard · 1997 Meiji Get Card", image: "/shop/cards/meiji-1997-charizard.jpg", publicObjectId: "DEMO-011", physicalCopyIds: ["PA-COPY-000015"], status: "Available" },
  { id: "MEM-MORII-WEEDLE", label: "Weedle · Champion's Path 2", image: "/shop/binders/yuka-morii/weedle.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-METAPOD", label: "Metapod · Sun & Moon 2", image: "/shop/binders/yuka-morii/metapod.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-KAKUNA", label: "Kakuna · Team Up 4", image: "/shop/binders/yuka-morii/kakuna.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-BLISSEY", label: "Blissey · Neo Revelation 2", image: "/shop/binders/yuka-morii/blissey.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-EXEGGCUTE", label: "Exeggcute · Forbidden Light 1", image: "/shop/binders/yuka-morii/exeggcute.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-CACNEA", label: "Cacnea · BREAKthrough 4", image: "/shop/binders/yuka-morii/cacnea.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-SEWADDLE", label: "Sewaddle · Legendary Treasures 9", image: "/shop/binders/yuka-morii/sewaddle.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-FOONGUS", label: "Foongus · Steam Siege 12", image: "/shop/binders/yuka-morii/foongus.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MORII-WOBBUFFET", label: "Wobbuffet · HeartGold & SoulSilver 13", image: "/shop/binders/yuka-morii/wobbuffet.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-SOUTHERN", label: "Mew · Southern Islands 1", image: "/shop/binders/mew/southern-islands.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-POP4", label: "Mew · POP Series 4", image: "/shop/binders/mew/pop-series-4.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-LEGEND", label: "Mew · Legend Maker 10", image: "/shop/binders/mew/legend-maker.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-PROMO8", label: "Mew · Black Star Promo 8", image: "/shop/binders/mew/black-star-8.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-ANCIENT", label: "Ancient Mew · Black Star Promo 9", image: "/shop/binders/mew/ancient-mew.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-SECRET", label: "Mew · Secret Wonders 15", image: "/shop/binders/mew/secret-wonders.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-EXPEDITION", label: "Mew · Expedition 19", image: "/shop/binders/mew/expedition.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-FATES", label: "Mew · Fates Collide 29", image: "/shop/binders/mew/fates-collide.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
  { id: "MEM-MEW-HIDDEN", label: "Mew · Hidden Fates 32", image: "/shop/binders/mew/hidden-fates.png", publicObjectId: null, physicalCopyIds: [], status: "Not currently held" },
];

export const storeCollections: StoreCollection[] = [
  { id: "STORE-COL-001", slug: "the-sugimori-archive", title: "The Sugimori Archive", subtitle: "Foundational silhouettes and a world drawn into focus.", description: "An editorial collection connecting early character art, promotional cards, and the visual economy that made Pokémon readable at every scale.", curatorNote: "The point is not to complete a conventional set. It is to notice how posture, outline, and restraint created characters that could survive a Game Boy screen, a card, and a global visual culture.", type: "editorial", category: "Artists", era: "1996–2000", heroImages: ["/shop/cards/bulbasaur-base.png", "/shop/cards/haunter-fossil.png", "/shop/cards/pikachu-promo.png"], memberIds: ["MEM-SUGIMORI-B", "MEM-SUGIMORI-H", "MEM-PIKACHU", "MEM-MEW"], physicalCopyIds: ["PA-COPY-000008", "PA-COPY-000009"], relatedArchiveIds: ["public-visual-identity"], presentationOptionIds: ["sleeve", "capsule", "curatedSet"], price: null, demo: true },
  { id: "STORE-COL-002", slug: "base-set-starters", title: "Base Set Starters", subtitle: "Three beginnings, kept together.", description: "A selected three-card set of the original partners as they appeared in the 1999 English Base Set.", curatorNote: "A familiar trio becomes more interesting when treated as one designed entry point: three types, three temperaments, and three equally memorable first choices.", type: "curatedSet", category: "Characters", era: "1999", heroImages: ["/shop/cards/bulbasaur-base.png", "/shop/cards/charmander-base.png", "/shop/cards/squirtle-base.png"], memberIds: ["MEM-STARTER-B", "MEM-STARTER-C", "MEM-STARTER-S"], physicalCopyIds: ["PA-COPY-000005", "PA-COPY-000006", "PA-COPY-000007"], relatedArchiveIds: ["public-visual-identity"], presentationOptionIds: ["binder", "curatedSet"], price: 72, demo: true },
  { id: "STORE-COL-003", slug: "kanto-ghosts", title: "Kanto Ghosts", subtitle: "A family built from atmosphere and silhouette.", description: "An open collecting guide for Gastly, Haunter, and Gengar pieces selected for mood, graphic shape, and unusual illustration choices.", curatorNote: "This collection can grow without becoming a checklist of every printing. Each addition has to contribute a new visual idea.", type: "open", category: "Visual Themes", era: "1996–present", heroImages: ["/shop/cards/gastly-fossil.png", "/shop/cards/haunter-fossil.png", "/shop/cards/gengar-fossil.png"], memberIds: ["MEM-GASTLY", "MEM-HAUNTER", "MEM-GENGAR"], physicalCopyIds: [], relatedArchiveIds: [], presentationOptionIds: ["sleeve", "capsule", "binder"], price: null, demo: true },
  { id: "STORE-COL-004", slug: "black-star-studies", title: "Black Star Studies", subtitle: "Early promotional images beyond the booster pack.", description: "A small curated pairing of Pikachu and Mew promotional cards, selected as two different expressions of Pokémon’s early public identity.", curatorNote: "Mascot and mystery: one immediately recognizable, one deliberately elusive.", type: "curatedSet", category: "Eras", era: "1999–2000", heroImages: ["/shop/cards/pikachu-promo.png", "/shop/cards/mew-promo.png"], memberIds: ["MEM-BLACKSTAR-P", "MEM-BLACKSTAR-M"], physicalCopyIds: ["PA-COPY-000010", "PA-COPY-000011"], relatedArchiveIds: [], presentationOptionIds: ["sleeve", "capsule", "curatedSet"], price: 65, demo: true },
  { id: "STORE-COL-005", slug: "before-the-tcg", title: "Before the TCG", subtitle: "The first pocket-sized ways to collect Pokémon.", description: "A focused group of 1996 Bandai Carddass cards from the period just before the Pokémon Trading Card Game became the dominant format.", curatorNote: "These cards matter because they preserve the franchise at the moment collecting was becoming part of the experience—not as a price tier, but as a numbered visual encyclopedia.", type: "editorial", category: "Eras", era: "1996", heroImages: ["/shop/cards/carddass-pikachu.jpg", "/shop/cards/carddass-charmander.jpg"], memberIds: ["MEM-CARDDASS-P", "MEM-CARDDASS-C"], physicalCopyIds: ["PA-COPY-000012", "PA-COPY-000013"], relatedArchiveIds: ["carddass-action-1"], presentationOptionIds: ["sleeve", "capsule", "binder"], price: 34, demo: true },
  { id: "STORE-COL-006", slug: "everyday-pokemon-japan", title: "Everyday Pokémon Japan", subtitle: "Snack premiums, small print, and ordinary encounters.", description: "A growing collection of inexpensive cards and paper pieces distributed through food, retail, mail, and promotion in late-1990s Japan.", curatorNote: "The most revealing collectibles are not always the rarest. These small premiums show how Pokémon became part of daily life beyond the Game Boy and the card shop.", type: "open", category: "Visual Themes", era: "1997–2002", heroImages: ["/shop/cards/meiji-1997-mewtwo.jpeg", "/shop/cards/meiji-1997-charizard.jpg", "/shop/cards/carddass-pikachu.jpg"], memberIds: ["MEM-MEIJI-M", "MEM-MEIJI-C", "MEM-CARDDASS-P"], physicalCopyIds: ["PA-COPY-000014", "PA-COPY-000015"], relatedArchiveIds: [], presentationOptionIds: ["sleeve", "capsule", "binder"], price: null, demo: true },
  { id: "STORE-COL-007", slug: "yuka-morii-binder", title: "Yuka Morii Binder", subtitle: "Nine clay-built Pokémon across two decades of card illustration.", description: "A nine-card binder study of Yuka Morii's instantly recognizable clay Pokémon photography, moving from Neo Revelation through Sword & Shield.", curatorNote: "The binder is organized as a miniature exhibition: handmade figures, real textures, and small constructed environments that make every Pokémon feel physically present.", type: "editorial", category: "Artists", era: "2001–2020", heroImages: ["/shop/binders/yuka-morii/blissey.png", "/shop/binders/yuka-morii/wobbuffet.png", "/shop/binders/yuka-morii/weedle.png"], memberIds: ["MEM-MORII-BLISSEY", "MEM-MORII-WOBBUFFET", "MEM-MORII-SEWADDLE", "MEM-MORII-CACNEA", "MEM-MORII-FOONGUS", "MEM-MORII-METAPOD", "MEM-MORII-EXEGGCUTE", "MEM-MORII-KAKUNA", "MEM-MORII-WEEDLE"], physicalCopyIds: [], relatedArchiveIds: [], presentationOptionIds: ["binder"], price: null, demo: true },
  { id: "STORE-COL-008", slug: "mew-binder", title: "Mew Binder", subtitle: "Nine interpretations of Pokémon's original mystery.", description: "A nine-card visual history of Mew, spanning Southern Islands, early promotional cards, the e-Card era, and later illustrated sets.", curatorNote: "Seen together, the cards reveal how artists alternate between Mew as ancient discovery, playful creature, psychic apparition, and weightless symbol.", type: "editorial", category: "Characters", era: "1999–2019", heroImages: ["/shop/binders/mew/southern-islands.png", "/shop/binders/mew/ancient-mew.png", "/shop/binders/mew/hidden-fates.png"], memberIds: ["MEM-MEW-SOUTHERN", "MEM-MEW-PROMO8", "MEM-MEW-ANCIENT", "MEM-MEW-EXPEDITION", "MEM-MEW-LEGEND", "MEM-MEW-POP4", "MEM-MEW-SECRET", "MEM-MEW-FATES", "MEM-MEW-HIDDEN"], physicalCopyIds: [], relatedArchiveIds: [], presentationOptionIds: ["binder"], price: null, demo: true },
];

export const binderProducts: BinderProduct[] = [
  { id: "BINDER-DEMO-001", title: "Base Set Starters", volume: "Volume I", physicalCopyIds: ["PA-COPY-000005", "PA-COPY-000006", "PA-COPY-000007"], binderDesignVersion: "PA-BINDER-01", collectionId: "STORE-COL-002", editionNumber: null, packaging: "Archival binder, title page, curator note, numbered positions, and QR record", totalPrice: 114, demo: true },
  { id: "BINDER-DEMO-002", title: "Before the TCG", volume: "Volume II", physicalCopyIds: ["PA-COPY-000012", "PA-COPY-000013"], binderDesignVersion: "PA-BINDER-01", collectionId: "STORE-COL-005", editionNumber: null, packaging: "Archival binder pages, format guide, curator note, numbered positions, and QR record", totalPrice: 58, demo: true },
  { id: "BINDER-DEMO-003", title: "Everyday Pokémon Japan", volume: "Volume III", physicalCopyIds: ["PA-COPY-000014", "PA-COPY-000015"], binderDesignVersion: "PA-BINDER-01", collectionId: "STORE-COL-006", editionNumber: null, packaging: "Archival binder pages, cultural timeline, curator note, numbered positions, and QR record", totalPrice: 50, demo: true },
];

export const futureArtistProgram: ArtistProgramProfile[] = [
  { id: "ARTIST-PROGRAM-PLACEHOLDER", name: "Artists at Pocket Archives", status: "future", originalWorkOnly: true, licensedWorkRequired: true, mediums: ["Original drawing", "Painting", "Print", "Independent card art", "Custom collectible"] },
];

export const galleryObjectIds = ["LIVE-025", "LIVE-024", "LIVE-023", "LIVE-022", "LIVE-021", "LIVE-020", "LIVE-019", "LIVE-018", "LIVE-017", "LIVE-016", "LIVE-015", "LIVE-014", "LIVE-013", "LIVE-012", "LIVE-011", "LIVE-010", "LIVE-009", "LIVE-008", "LIVE-007", "LIVE-006", "LIVE-005", "LIVE-004", "LIVE-002", "LIVE-003", "LIVE-001", "DEMO-004", "DEMO-005", "DEMO-006", "DEMO-002"];
export const binderObjectIds = ["LIVE-025", "LIVE-024", "LIVE-023", "LIVE-022", "LIVE-021", "LIVE-020", "LIVE-019", "LIVE-018", "LIVE-017", "LIVE-016", "LIVE-015", "LIVE-014", "LIVE-013", "LIVE-012", "LIVE-011", "LIVE-010", "LIVE-009", "LIVE-008", "LIVE-007", "LIVE-006", "LIVE-005", "LIVE-004", "LIVE-002", "LIVE-003", "LIVE-001", "DEMO-001", "DEMO-003", "DEMO-008", "DEMO-009", "DEMO-010", "DEMO-011"];
export const binderCollectionSlugs = ["yuka-morii-binder", "mew-binder"];
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
