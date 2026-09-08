import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate, canCreateEbayDraft, INGESTION_STATES } from "../scripts/ingestion/confidence.mjs";

const identity = { game: "Pokémon", name: "Pikachu", setName: "Base Set", cardNumber: "58", language: "English", finish: "Non-Holo" };
const exact = { verified: true, exactNumber: true, exactSet: true, exactLanguage: true, exactFinish: true, identity };
const quality = { rescanRequired: false, reasons: [] };
const orientation = { confidence: "high" };

test("only an exact complete match is eligible for an eBay draft", () => {
  const result = scoreCandidate({ candidate: identity, externalMatch: exact, quality, orientation });
  assert.equal(result.state, INGESTION_STATES.AUTO_DRAFT);
  assert.equal(canCreateEbayDraft(result), true);
});

test("a finish mismatch is forced into review", () => {
  const result = scoreCandidate({ candidate: identity, externalMatch: { ...exact, exactFinish: false }, quality, orientation });
  assert.equal(result.state, INGESTION_STATES.REVIEW);
  assert.equal(canCreateEbayDraft(result), false);
  assert.ok(result.reasons.includes("FINISH_NOT_EXACT"));
});

test("an external identity conflict is never auto-drafted", () => {
  const result = scoreCandidate({ candidate: identity, externalMatch: { ...exact, identity: { ...identity, name: "Raichu" } }, quality, orientation });
  assert.equal(result.state, INGESTION_STATES.CONFLICT);
  assert.equal(canCreateEbayDraft(result), false);
});

test("poor scan quality routes directly to rescan", () => {
  const result = scoreCandidate({ candidate: identity, externalMatch: exact, quality: { rescanRequired: true, reasons: ["FRONT_IMAGE_TOO_SMALL"] }, orientation });
  assert.equal(result.state, INGESTION_STATES.RESCAN);
});
