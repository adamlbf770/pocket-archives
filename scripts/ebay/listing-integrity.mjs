const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const token = (value) => clean(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const IDENTITY_ASPECTS = Object.freeze({
  game: ["Game"],
  name: ["Card Name"],
  setName: ["Set"],
  cardNumber: ["Card Number"],
  language: ["Language"],
  finish: ["Finish"],
});

export function assertListingPublishSafe({ record, item, attachment }) {
  const verification = record?.verification;
  if (!verification) throw new Error(`${record?.sku}: publish blocked (missing listing verification certificate).`);
  if (!["EXTERNAL_HIGH_CONFIDENCE", "HUMAN_REVIEWED"].includes(verification.mode)) {
    throw new Error(`${record.sku}: publish blocked (unsupported verification mode).`);
  }
  if (verification.mode === "EXTERNAL_HIGH_CONFIDENCE") {
    if (verification.grade !== "HIGH" || Number(verification.score) < 92 || !verification.externalId) {
      throw new Error(`${record.sku}: publish blocked (external identity is not high confidence).`);
    }
  }
  if (verification.mode === "HUMAN_REVIEWED" && !clean(verification.reviewedBy)) {
    throw new Error(`${record.sku}: publish blocked (human reviewer is not recorded).`);
  }
  if (verification.unresolved?.length) {
    throw new Error(`${record.sku}: publish blocked (unresolved: ${verification.unresolved.join(", ")}).`);
  }
  if (verification.orientation?.front !== "UPRIGHT" || verification.orientation?.back !== "UPRIGHT") {
    throw new Error(`${record.sku}: publish blocked (front/back orientation not certified upright).`);
  }

  const identity = verification.identity ?? {};
  for (const field of Object.keys(IDENTITY_ASPECTS)) {
    if (!clean(identity[field])) throw new Error(`${record.sku}: publish blocked (identity missing ${field}).`);
  }

  const aspects = item?.product?.aspects ?? {};
  for (const [field, names] of Object.entries(IDENTITY_ASPECTS)) {
    const actual = aspectValue(aspects, names);
    if (!actual || token(actual) !== token(identity[field])) {
      throw new Error(`${record.sku}: publish blocked (${field} conflicts with certified identity).`);
    }
  }

  const title = clean(item?.product?.title);
  for (const [field, value] of [["name", identity.name], ["cardNumber", identity.cardNumber]]) {
    if (!token(title).includes(token(value))) {
      throw new Error(`${record.sku}: publish blocked (title omits certified ${field}).`);
    }
  }
  if (!/^english$/i.test(identity.language) && !token(title).includes(token(identity.language))) {
    throw new Error(`${record.sku}: publish blocked (title omits certified language).`);
  }

  verifyClaim(record.sku, title, /reverse\s*holo/i, identity.finish, /reverse\s*holo/i, "Reverse Holo");
  verifyClaim(record.sku, title, /first\s*edition|1st\s*edition/i, identity.edition, /first\s*edition|1st\s*edition/i, "First Edition");
  verifyClaim(record.sku, title, /full\s*art/i, `${identity.variant} ${identity.rarity}`, /full\s*art/i, "Full Art");
  verifyClaim(record.sku, title, /triple\s*rare|\bRRR\b/i, identity.rarity, /triple\s*rare|\bRRR\b/i, "Triple Rare");

  const currentImages = item?.product?.imageUrls ?? [];
  if (currentImages.length < 2) throw new Error(`${record.sku}: publish blocked (front/back image pair required).`);
  if (Number(attachment?.imageCount) !== currentImages.length) {
    throw new Error(`${record.sku}: publish blocked (image attachment log mismatch).`);
  }
  if (verification.imageUrls?.length && !sameList(verification.imageUrls, currentImages)) {
    throw new Error(`${record.sku}: publish blocked (images differ from the verified pair).`);
  }
  return true;
}

function aspectValue(aspects, names) {
  for (const name of names) {
    const match = Object.entries(aspects).find(([key]) => token(key) === token(name));
    if (match?.[1]?.[0]) return clean(match[1][0]);
  }
  return "";
}

function verifyClaim(sku, title, titlePattern, evidence, evidencePattern, label) {
  if (titlePattern.test(title) && !evidencePattern.test(clean(evidence))) {
    throw new Error(`${sku}: publish blocked (unsupported ${label} claim in title).`);
  }
}

function sameList(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
