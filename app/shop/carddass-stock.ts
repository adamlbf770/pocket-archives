import type { InventoryItem, ObjectImage } from "./catalog";

function ownedPhoto(src: string, caption: string, view: "front" | "back"): ObjectImage {
  return {
    src,
    caption,
    view,
    creator: "Pocket Archives",
    rightsHolder: "Pocket Archives",
    rightsStatus: "allowed",
    usageBasis: "Original scan of physical inventory owned by Pocket Archives",
  };
}

function carddassItem({
  accessionNumber,
  id,
  slug,
  title,
  fileNumber,
  pokemonId,
  price,
}: {
  accessionNumber: string;
  id: string;
  slug: string;
  title: string;
  fileNumber: string;
  pokemonId: number;
  price: number;
}): InventoryItem {
  const imageBase = `/shop/inventory/batch-21/${accessionNumber.toLowerCase()}`;

  return {
    accessionNumber,
    id,
    slug,
    title,
    subtitle: `1997 Bandai Carddass Pocket Monsters — File No.${fileNumber}`,
    objectType: "Collectible card",
    category: "Carddass",
    description: `An original 1997 Japanese Bandai Carddass Pocket Monsters card featuring ${title}. This is the exact physical copy shown in the front and reverse scans.`,
    archivalNote:
      "Bandai's numbered Carddass series helped move Pokémon from the Game Boy into everyday Japanese collecting culture during the franchise's first years.",
    culturalSignificance:
      "An early licensed Pokémon collectible from the period before the international trading-card boom.",
    year: 1997,
    approximateYear: false,
    era: "Early franchise · 1996–1999",
    country: "Japan",
    language: "Japanese",
    artist: null,
    illustrator: null,
    manufacturer: "Bandai",
    publisher: "Bandai",
    set: "Bandai Carddass Pocket Monsters",
    series: "File Number series",
    cardNumber: `File No.${fileNumber}`,
    catalogNumber: accessionNumber,
    edition: null,
    printing: "1997 Japanese issue",
    condition: "Moderately Played",
    conditionNotes:
      "Moderately Played per owner inspection. The scans show the exact physical copy; visible edge whitening, surface wear, and handling marks are consistent with the assigned condition. No professional grade is claimed.",
    dimensions: "Approximately 59 × 86 mm",
    provenance: "Pocket Archives inventory; cataloged in Batch 21 from Pokémon Ultrarare Box 1.",
    acquisitionSource: "Pocket Archives collection",
    acquisitionDate: "2026-08",
    pokemonIds: [pokemonId],
    pokemonNames: [title],
    artistIds: [],
    relatedMuseumIds: [],
    relatedArchiveIds: ["carddass-action-1"],
    relatedCardIds: [],
    relatedCollectionIds: ["before-the-tcg", "carddass-first-generation"],
    tags: ["Live Inventory", "Bandai Carddass", "Japanese", "Vintage", "Original 151", "Carddass"],
    fromArchive: false,
    physicalOwnership: true,
    commerceMode: "fixedPrice",
    recordState: "available",
    availabilityStatus: "available",
    price,
    currency: "USD",
    quantity: 1,
    reserved: false,
    soldDate: null,
    placedInPrivateCollection: false,
    images: [
      ownedPhoto(`${imageBase}-front.jpg`, `${title} Carddass File No.${fileNumber} — front scan`, "front"),
      ownedPhoto(`${imageBase}-back.jpg`, `${title} Carddass File No.${fileNumber} — reverse scan`, "back"),
    ],
    sourceMetadata: "Original front and reverse scans by Pocket Archives.",
    rightsMetadata: "Photographs © Pocket Archives; underlying character and card artwork remain the property of their respective rights holders.",
    featured: true,
    demo: false,
  };
}

export const carddassShopStock: InventoryItem[] = [
  carddassItem({ accessionNumber: "PA-3642", id: "LIVE-032", slug: "chansey-bandai-carddass-file-113-pa-3642", title: "Chansey", fileNumber: "113", pokemonId: 113, price: 19.99 }),
  carddassItem({ accessionNumber: "PA-3643", id: "LIVE-033", slug: "slowbro-bandai-carddass-file-080-pa-3643", title: "Slowbro", fileNumber: "080", pokemonId: 80, price: 16.49 }),
  carddassItem({ accessionNumber: "PA-3644", id: "LIVE-034", slug: "hypno-bandai-carddass-file-097-pa-3644", title: "Hypno", fileNumber: "097", pokemonId: 97, price: 13.49 }),
  carddassItem({ accessionNumber: "PA-3645", id: "LIVE-035", slug: "marowak-bandai-carddass-file-105-pa-3645", title: "Marowak", fileNumber: "105", pokemonId: 105, price: 9.49 }),
];
