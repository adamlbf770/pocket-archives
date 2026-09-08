import { createHash } from "node:crypto";

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const keyPart = (value) => clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export function normalizeIdentity(input = {}) {
  const identity = {
    game: clean(input.game),
    name: clean(input.name),
    setName: clean(input.setName ?? input.set),
    setCode: clean(input.setCode),
    cardNumber: clean(input.cardNumber ?? input.number),
    language: clean(input.language),
    finish: clean(input.finish),
    rarity: clean(input.rarity),
    variant: clean(input.variant),
    edition: clean(input.edition),
    finishVerified: input.finishVerified === true,
  };
  identity.canonicalKey = [identity.game, identity.name, identity.setCode || identity.setName, identity.cardNumber, identity.language, identity.finish, identity.variant, identity.edition]
    .map(keyPart).join("|");
  identity.identityId = `card_${createHash("sha256").update(identity.canonicalKey).digest("hex").slice(0, 20)}`;
  return identity;
}

export function requiredIdentityFields(game) {
  const shared = ["game", "name", "setName", "cardNumber", "language", "finish"];
  if (/magic/i.test(game)) return [...shared, "setCode"];
  if (/yu-?gi-?oh/i.test(game)) return [...shared, "setCode"];
  if (/one piece/i.test(game)) return [...shared, "setCode"];
  return shared;
}

export function identityConflicts(left, right) {
  const fields = ["game", "name", "setCode", "setName", "cardNumber", "language", "finish", "variant", "edition"];
  return fields.filter((field) => clean(left?.[field]) && clean(right?.[field]) && keyPart(left[field]) !== keyPart(right[field]));
}

export function duplicateKey(identity) {
  return normalizeIdentity(identity).canonicalKey;
}
