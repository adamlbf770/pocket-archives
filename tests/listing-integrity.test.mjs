import assert from "node:assert/strict";
import test from "node:test";
import { assertListingPublishSafe } from "../scripts/ebay/listing-integrity.mjs";

const identity = {
  game: "Pokémon",
  name: "Eevee",
  setName: "Scarlet & Violet Promo",
  cardNumber: "SVP 173",
  language: "English",
  finish: "Holo",
  rarity: "Promo",
  variant: "",
  edition: "Unlimited",
};
const images = ["https://example.com/front.jpg", "https://example.com/back.jpg"];
const item = {
  product: {
    title: "Pokemon Eevee SVP 173 Scarlet Violet Promo Holo NM",
    imageUrls: images,
    aspects: {
      Game: ["Pokémon"],
      "Card Name": ["Eevee"],
      Set: ["Scarlet & Violet Promo"],
      "Card Number": ["SVP 173"],
      Language: ["English"],
      Finish: ["Holo"],
    },
  },
};
const record = {
  sku: "PA-TEST",
  verification: {
    mode: "EXTERNAL_HIGH_CONFIDENCE",
    grade: "HIGH",
    score: 100,
    externalId: "catalog-123",
    unresolved: [],
    orientation: { front: "UPRIGHT", back: "UPRIGHT" },
    identity,
    imageUrls: images,
  },
};
const attachment = { imageCount: 2 };

test("a fully certified exact listing can pass the final publish gate", () => {
  assert.equal(assertListingPublishSafe({ record, item, attachment }), true);
});

test("publishing fails closed when no verification certificate exists", () => {
  assert.throws(
    () => assertListingPublishSafe({ record: { sku: "PA-TEST" }, item, attachment }),
    /missing listing verification certificate/i,
  );
});

test("certified identity must match the eBay item specifics", () => {
  const wrongLanguage = structuredClone(item);
  wrongLanguage.product.aspects.Language = ["Chinese"];
  assert.throws(
    () => assertListingPublishSafe({ record, item: wrongLanguage, attachment }),
    /language conflicts with certified identity/i,
  );
});

test("unsupported Full Art and Triple Rare claims are blocked", () => {
  for (const claim of ["Full Art", "Triple Rare"]) {
    const wrongTitle = structuredClone(item);
    wrongTitle.product.title += ` ${claim}`;
    assert.throws(
      () => assertListingPublishSafe({ record, item: wrongTitle, attachment }),
      new RegExp(`unsupported ${claim} claim`, "i"),
    );
  }
});

test("changed or uncertified image orientation blocks publication", () => {
  const upsideDown = structuredClone(record);
  upsideDown.verification.orientation.back = "UNKNOWN";
  assert.throws(
    () => assertListingPublishSafe({ record: upsideDown, item, attachment }),
    /orientation not certified upright/i,
  );

  const changedImages = structuredClone(item);
  changedImages.product.imageUrls[1] = "https://example.com/different-back.jpg";
  assert.throws(
    () => assertListingPublishSafe({ record, item: changedImages, attachment }),
    /images differ from the verified pair/i,
  );
});
