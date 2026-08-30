import type { InventoryItem, ObjectImage } from "./catalog";

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

export const toppsShopStock: InventoryItem[] = [
  {
    accessionNumber: "PA-TOPPS-028",
    id: "LIVE-TOPPS-028",
    slug: "sandslash-1999-topps-tv-animation-28-foil",
    title: "Sandslash",
    subtitle: "1999 Topps Pokémon TV Animation Edition · #28 · Foil",
    objectType: "Collectible card",
    category: "Cards",
    description:
      "An original 1999 Topps Pokémon TV Animation Edition Series 1 foil card featuring Sandslash. This is the exact physical copy shown in the front and reverse photographs.",
    archivalNote:
      "Topps translated the first 151 Pokémon and the television series into a distinctly late-1990s American card format, combining character art, Pokédex-style text, and foil variants outside the playable TCG.",
    culturalSignificance:
      "A foil example from Pokémon's first international merchandise wave and an early English-language collectible devoted to Sandslash.",
    year: 1999,
    approximateYear: false,
    era: "International launch era · 1999",
    country: "United States",
    language: "English",
    artist: null,
    illustrator: null,
    manufacturer: "The Topps Company, Inc.",
    publisher: "The Topps Company, Inc.",
    set: "Pokémon TV Animation Edition Series 1",
    series: "Topps Pokémon TV Animation Edition",
    cardNumber: "#28",
    catalogNumber: "PA-TOPPS-028",
    edition: "Series 1",
    printing: "English · Foil",
    condition: "Moderately Played",
    conditionNotes:
      "Moderately Played based on the submitted photographs, with visible surface and edge wear. The photographs show the exact physical copy; no professional grade is claimed.",
    dimensions: "Approximately 64 × 89 mm",
    provenance: "Pocket Archives inventory; photographed as part of the local Topps/Card batch.",
    acquisitionSource: "Pocket Archives collection",
    acquisitionDate: "2026-08",
    pokemonIds: [28],
    pokemonNames: ["Sandslash"],
    artistIds: [],
    relatedMuseumIds: [],
    relatedArchiveIds: [],
    relatedCardIds: [],
    relatedCollectionIds: ["topps-pokemon-tv-animation"],
    tags: ["Live Inventory", "Topps", "Foil", "1999", "English", "Vintage", "Original 151"],
    fromArchive: false,
    physicalOwnership: true,
    commerceMode: "fixedPrice",
    recordState: "available",
    availabilityStatus: "available",
    price: 9.99,
    currency: "USD",
    quantity: 1,
    reserved: false,
    soldDate: null,
    placedInPrivateCollection: false,
    images: [
      ownedPhoto("/shop/inventory/topps/sandslash-28-front.jpg", "1999 Topps Sandslash #28 foil — front photograph", "front"),
      ownedPhoto("/shop/inventory/topps/sandslash-28-back.jpg", "1999 Topps Sandslash #28 foil — reverse photograph", "back"),
    ],
    sourceMetadata: "Original front and reverse photographs supplied by Pocket Archives.",
    rightsMetadata:
      "Photographs © Pocket Archives; underlying character and card artwork remain the property of their respective rights holders.",
    featured: true,
    demo: false,
  },
];
