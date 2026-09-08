import test from "node:test";
import assert from "node:assert/strict";
import { duplicateKey, identityConflicts, normalizeIdentity } from "../scripts/ingestion/identity.mjs";

test("canonical identity includes language and finish", () => {
  const base = { game: "Pokémon", name: "Pikachu", setName: "Base Set", cardNumber: "58", language: "English", finish: "Non-Holo" };
  assert.notEqual(duplicateKey(base), duplicateKey({ ...base, language: "Japanese" }));
  assert.notEqual(duplicateKey(base), duplicateKey({ ...base, finish: "Reverse Holo" }));
});

test("normalization is stable across punctuation and spacing", () => {
  assert.equal(normalizeIdentity({ game: "Yu-Gi-Oh!", name: "Blue-Eyes  White Dragon" }).identityId, normalizeIdentity({ game: "Yu Gi Oh", name: "Blue Eyes White Dragon" }).identityId);
});

test("conflicts report exact fields", () => {
  assert.deepEqual(identityConflicts({ name: "Eevee", language: "Chinese" }, { name: "Eevee", language: "English" }), ["language"]);
});
