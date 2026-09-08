import { canCreateEbayDraft } from "./confidence.mjs";

export function assertEbayDraftSafe(card) {
  if (!canCreateEbayDraft(card.confidence)) throw new Error(`${card.sku}: eBay draft blocked (${card.confidence?.reasons?.join(", ") || card.confidence?.state || "unverified"})`);
  if (!card.front?.path || !card.back?.path) throw new Error(`${card.sku}: eBay draft blocked (missing image pair)`);
  if (!card.externalMatch?.externalId) throw new Error(`${card.sku}: eBay draft blocked (missing external catalog ID)`);
  return true;
}
