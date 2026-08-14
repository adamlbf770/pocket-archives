import { demoInventory, type InventoryItem } from "../shop/catalog";

export type SaleStatus = "Draft" | "Preview" | "Open" | "Closed" | "Archived";
export type LotStatus = "Preview" | "Open" | "Closed" | "Sold" | "Passed" | "Reserve Not Met" | "Withdrawn";
export type PaymentStatus = "not-applicable" | "pending" | "invoiced" | "paid" | "refunded";

export type BidIncrementRule = { minimum: number; maximum: number | null; increment: number };

export type AuctionSale = {
  id: string;
  slug: string;
  saleNumber: number;
  title: string;
  subtitle: string;
  description: string;
  curatorNote: string;
  startDate: string;
  endDate: string;
  status: SaleStatus;
  heroImage: string;
  lotIds: string[];
  estimatedLotCount: number;
  theme: string;
  era: string;
  artists: string[];
  pokemonIds: number[];
  featuredLotIds: string[];
  published: boolean;
  archived: boolean;
  antiSniping: { enabled: boolean; triggerMinutes: number; extensionMinutes: number };
  incrementRules: BidIncrementRule[];
  demo: true;
};

export type AuctionLot = {
  id: string;
  saleId: string;
  lotNumber: number;
  objectId: string;
  openingBid: number;
  estimateLow: number;
  estimateHigh: number;
  currentBid: number | null;
  reserveEnabled: boolean;
  reserveMet: boolean;
  bidCount: number;
  openingTime: string;
  closingTime: string;
  status: LotStatus;
  winningBid: number | null;
  winningBidderId: string | null;
  paymentStatus: PaymentStatus;
  extensionCount: number;
  proxyBiddingEnabled: false;
  demo: true;
};

export type PublicBid = {
  id: string;
  lotId: string;
  bidderAlias: string;
  amount: number;
  placedAt: string;
  demo: true;
};

// Future secure-account and dealer-desk records. They are deliberately not
// connected to the public demo until authenticated writes and payments exist.
export type BidderAccount = {
  id: string;
  name: string;
  email: string;
  billingProfileId: string | null;
  shippingProfileId: string | null;
  paymentMethodId: string | null;
  verifiedAt: string | null;
};

export type ProxyBid = {
  id: string;
  lotId: string;
  bidderId: string;
  maximumAmount: number;
  active: boolean;
  createdAt: string;
};

export type AuctionAdminAction = {
  id: string;
  actorId: string;
  action: string;
  saleId: string | null;
  lotId: string | null;
  reason: string | null;
  createdAt: string;
};

export type AuctionSettlement = {
  lotId: string;
  winnerId: string;
  winningBid: number;
  orderId: string | null;
  invoiceId: string | null;
  combinedShippingGroupId: string | null;
  paymentStatus: PaymentStatus;
};

export const defaultBidIncrementRules: BidIncrementRule[] = [
  { minimum: 0, maximum: 49, increment: 2 },
  { minimum: 50, maximum: 99, increment: 5 },
  { minimum: 100, maximum: 499, increment: 10 },
  { minimum: 500, maximum: null, increment: 25 },
];

// Sale 001 is a fixed seven-lot demonstration. New shop inventory should not
// silently become auction lots just because it was added to the catalog.
const lotObjectIds = demoInventory.slice(0, 7).map((item) => item.id);

export const demoSales: AuctionSale[] = [
  {
    id: "DEMO-SALE-001",
    slug: "the-sugimori-years",
    saleNumber: 1,
    title: "The Sugimori Years",
    subtitle: "Selected cards and collectible pieces from Pokémon’s foundational visual era.",
    description: "A small demonstration catalog tracing how memorable silhouettes, watercolor character art, and early printed collecting culture established Pokémon’s public identity.",
    curatorNote: "These demonstration lots show the intended structure of a Pocket Archives sale. No physical items or real bids are represented.",
    startDate: "2026-08-10T12:00:00-04:00",
    endDate: "2026-08-16T20:00:00-04:00",
    status: "Open",
    heroImage: "/shop/cards/bulbasaur-base.png",
    lotIds: lotObjectIds.map((_, index) => `DEMO-LOT-${String(index + 1).padStart(3, "0")}`),
    estimatedLotCount: lotObjectIds.length,
    theme: "Foundational Pokémon design",
    era: "1996–1999",
    artists: ["Ken Sugimori"],
    pokemonIds: [1, 4, 7, 25, 93, 151],
    featuredLotIds: ["DEMO-LOT-001", "DEMO-LOT-005", "DEMO-LOT-007"],
    published: true,
    archived: false,
    antiSniping: { enabled: true, triggerMinutes: 2, extensionMinutes: 2 },
    incrementRules: defaultBidIncrementRules,
    demo: true,
  },
  {
    id: "DEMO-SALE-000",
    slug: "early-carddass-study",
    saleNumber: 0,
    title: "Early Carddass Study",
    subtitle: "A demonstration of the permanent sale archive.",
    description: "A quiet catalog record showing how completed Pocket Archives sales will remain browsable after they close.",
    curatorNote: "Archived demonstration record only.",
    startDate: "2025-11-02T12:00:00-05:00",
    endDate: "2025-11-09T20:00:00-05:00",
    status: "Archived",
    heroImage: "/shop/cards/haunter-fossil.png",
    lotIds: [],
    estimatedLotCount: 8,
    theme: "Early Japanese Carddass",
    era: "1997",
    artists: ["Ken Sugimori"],
    pokemonIds: [1, 25, 93],
    featuredLotIds: [],
    published: true,
    archived: true,
    antiSniping: { enabled: false, triggerMinutes: 2, extensionMinutes: 2 },
    incrementRules: defaultBidIncrementRules,
    demo: true,
  },
];

const lotValues = [
  [12, 20, 35, 24, 7],
  [18, 30, 50, 32, 5],
  [16, 25, 40, 28, 6],
  [24, 40, 60, 45, 9],
  [40, 60, 90, 72, 8],
  [28, 45, 70, 50, 6],
  [35, 55, 85, 65, 7],
] as const;

export const demoLots: AuctionLot[] = lotObjectIds.map((objectId, index) => ({
  id: `DEMO-LOT-${String(index + 1).padStart(3, "0")}`,
  saleId: "DEMO-SALE-001",
  lotNumber: index + 1,
  objectId,
  openingBid: lotValues[index][0],
  estimateLow: lotValues[index][1],
  estimateHigh: lotValues[index][2],
  currentBid: lotValues[index][3],
  reserveEnabled: index === 4,
  reserveMet: index === 4,
  bidCount: lotValues[index][4],
  openingTime: "2026-08-10T12:00:00-04:00",
  closingTime: `2026-08-16T20:${String(index * 2).padStart(2, "0")}:00-04:00`,
  status: "Open",
  winningBid: null,
  winningBidderId: null,
  paymentStatus: "not-applicable",
  extensionCount: 0,
  proxyBiddingEnabled: false,
  demo: true,
}));

export const demoBidHistory: PublicBid[] = demoLots.flatMap((lot, index) => [
  { id: `${lot.id}-B1`, lotId: lot.id, bidderAlias: `Bidder ${1042 + index}`, amount: lot.openingBid, placedAt: "2026-08-11T14:20:00-04:00", demo: true as const },
  { id: `${lot.id}-B2`, lotId: lot.id, bidderAlias: `Bidder ${1120 + index}`, amount: lot.currentBid || lot.openingBid, placedAt: "2026-08-13T19:05:00-04:00", demo: true as const },
]);

export function currentSale() { return demoSales.find((sale) => sale.status === "Open" || sale.status === "Preview"); }
export function saleBySlug(slug: string) { return demoSales.find((sale) => sale.slug === slug); }
export function lotsForSale(saleId: string) { return demoLots.filter((lot) => lot.saleId === saleId).sort((a, b) => a.lotNumber - b.lotNumber); }
export function lotByNumber(saleId: string, lotNumber: number) { return demoLots.find((lot) => lot.saleId === saleId && lot.lotNumber === lotNumber); }
export function lotForObject(objectId: string) { return demoLots.find((lot) => lot.objectId === objectId); }
export function objectForLot(lot: AuctionLot): InventoryItem | undefined { return demoInventory.find((item) => item.id === lot.objectId); }
export function bidHistoryForLot(lotId: string) { return demoBidHistory.filter((bid) => bid.lotId === lotId).sort((a, b) => b.amount - a.amount); }
export function lotUrl(sale: AuctionSale, lot: AuctionLot) { return `/sales/${sale.slug}/lots/${String(lot.lotNumber).padStart(2, "0")}`; }
export function minimumNextBid(lot: AuctionLot, sale: AuctionSale) {
  const current = lot.currentBid ?? lot.openingBid;
  const rule = sale.incrementRules.find(({ minimum, maximum }) => current >= minimum && (maximum === null || current <= maximum));
  return current + (rule?.increment ?? 1);
}
