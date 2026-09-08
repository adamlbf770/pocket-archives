import { identityConflicts, requiredIdentityFields } from "./identity.mjs";

export const INGESTION_STATES = Object.freeze({
  AUTO_DRAFT: "AUTO_DRAFT",
  REVIEW: "REVIEW",
  RESCAN: "RESCAN",
  CONFLICT: "CONFLICT",
});

export function scoreCandidate({ candidate, externalMatch, orientation, quality, duplicate = false }) {
  const reasons = [];
  const missing = requiredIdentityFields(candidate?.game).filter((field) => !String(candidate?.[field] ?? "").trim());
  const conflicts = externalMatch ? identityConflicts(candidate, externalMatch.identity) : [];
  let score = 0;

  if (quality?.rescanRequired) return { score: 0, grade: "LOW", state: INGESTION_STATES.RESCAN, reasons: quality.reasons };
  if (conflicts.length) return { score: 0, grade: "CONFLICT", state: INGESTION_STATES.CONFLICT, reasons: conflicts.map((field) => `EXTERNAL_CONFLICT_${field.toUpperCase()}`) };

  if (!missing.length) score += 35; else reasons.push(...missing.map((field) => `MISSING_${field.toUpperCase()}`));
  if (externalMatch?.verified) score += 35; else reasons.push("NO_EXTERNAL_VERIFICATION");
  if (externalMatch?.exactNumber) score += 10; else reasons.push("NUMBER_NOT_EXACT");
  if (externalMatch?.exactSet) score += 8; else reasons.push("SET_NOT_EXACT");
  if (externalMatch?.exactLanguage) score += 5; else reasons.push("LANGUAGE_NOT_EXACT");
  if (externalMatch?.exactFinish) score += 4; else reasons.push("FINISH_NOT_EXACT");
  if (orientation?.confidence === "high") score += 3; else reasons.push("ORIENTATION_AMBIGUOUS");
  if (duplicate) reasons.push("POSSIBLE_DUPLICATE");

  const high = score >= 92 && reasons.length === 0 && !duplicate;
  return {
    score,
    grade: high ? "HIGH" : score >= 65 ? "MEDIUM" : "LOW",
    state: high ? INGESTION_STATES.AUTO_DRAFT : INGESTION_STATES.REVIEW,
    reasons,
  };
}

export function canCreateEbayDraft(result) {
  return result?.state === INGESTION_STATES.AUTO_DRAFT && result?.grade === "HIGH" && result?.score >= 92 && !(result?.reasons?.length);
}
