import assert from "node:assert/strict";
import test from "node:test";
import { createExternalVerificationCertificate, createHumanVerificationCertificate } from "../scripts/ingestion/ebay-gate.mjs";

const card = {
  sku: "PA-CERT",
  condition: "Near Mint",
  guess: {
    game: "Pokémon",
    name: "Pikachu",
    setName: "Base Set",
    cardNumber: "58/102",
    language: "English",
    finish: "Non-Holo",
  },
  front: { path: "/tmp/front.jpg", orientation: { normalized: true } },
  back: { path: "/tmp/back.jpg", orientation: { normalized: true } },
  confidence: { state: "AUTO_DRAFT", grade: "HIGH", score: 100, reasons: [] },
  externalMatch: { externalId: "base1-58", source: "pokemon-tcg-api" },
};

test("exact external verification produces a publishable identity certificate", () => {
  const certificate = createExternalVerificationCertificate(card);
  assert.equal(certificate.mode, "EXTERNAL_HIGH_CONFIDENCE");
  assert.equal(certificate.identity.condition, "Near Mint");
  assert.deepEqual(certificate.orientation, { front: "UPRIGHT", back: "UPRIGHT" });
});

test("manual exception review records the reviewer and complete identity", () => {
  const certificate = createHumanVerificationCertificate(card, "Adam Finck");
  assert.equal(certificate.mode, "HUMAN_REVIEWED");
  assert.equal(certificate.reviewedBy, "Adam Finck");
  assert.match(certificate.reviewedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("manual review cannot waive missing identity or upright images", () => {
  assert.throws(
    () => createHumanVerificationCertificate({ ...card, guess: { ...card.guess, finish: "" } }, "Adam"),
    /identity missing finish/i,
  );
  assert.throws(
    () => createHumanVerificationCertificate({ ...card, back: { ...card.back, orientation: { normalized: false } } }, "Adam"),
    /not normalized upright/i,
  );
});
