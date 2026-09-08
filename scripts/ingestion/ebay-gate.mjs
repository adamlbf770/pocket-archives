import { canCreateEbayDraft } from "./confidence.mjs";

export function assertEbayDraftSafe(card) {
  if (!canCreateEbayDraft(card.confidence)) throw new Error(`${card.sku}: eBay draft blocked (${card.confidence?.reasons?.join(", ") || card.confidence?.state || "unverified"})`);
  if (!card.front?.path || !card.back?.path) throw new Error(`${card.sku}: eBay draft blocked (missing image pair)`);
  if (!card.externalMatch?.externalId) throw new Error(`${card.sku}: eBay draft blocked (missing external catalog ID)`);
  if (!card.front?.orientation?.normalized || !card.back?.orientation?.normalized) throw new Error(`${card.sku}: eBay draft blocked (images not normalized upright)`);
  if (!String(card.condition ?? "").trim()) throw new Error(`${card.sku}: eBay draft blocked (condition unresolved)`);
  return true;
}

export function createExternalVerificationCertificate(card) {
  assertEbayDraftSafe(card);
  return {
    mode: "EXTERNAL_HIGH_CONFIDENCE",
    grade: card.confidence.grade,
    score: card.confidence.score,
    externalId: card.externalMatch.externalId,
    externalSource: card.externalMatch.source,
    unresolved: [],
    orientation: { front: "UPRIGHT", back: "UPRIGHT" },
    identity: { ...card.guess, condition: card.condition },
    imageUrls: [],
  };
}

export function createHumanVerificationCertificate(card, reviewedBy) {
  if (!String(reviewedBy ?? "").trim()) throw new Error(`${card.sku}: reviewer name is required.`);
  if (!card.front?.orientation?.normalized || !card.back?.orientation?.normalized) {
    throw new Error(`${card.sku}: human review cannot certify images that are not normalized upright.`);
  }
  if (!String(card.condition ?? "").trim()) throw new Error(`${card.sku}: condition unresolved.`);
  for (const field of ["game", "name", "setName", "cardNumber", "language", "finish"]) {
    if (!String(card.guess?.[field] ?? "").trim()) throw new Error(`${card.sku}: identity missing ${field}.`);
  }
  return {
    mode: "HUMAN_REVIEWED",
    grade: "REVIEWED",
    score: null,
    reviewedBy: String(reviewedBy).trim(),
    reviewedAt: new Date().toISOString(),
    unresolved: [],
    orientation: { front: "UPRIGHT", back: "UPRIGHT" },
    identity: { ...card.guess, condition: card.condition },
    imageUrls: [],
  };
}
