import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDraftOnlyMutation,
  buildInventoryItem,
  buildOffer,
  findCardConditionDescriptor,
  normalizeDraft,
  sanitizeOrders,
} from "../scripts/ebay/core.mjs";

const normalizedDraft = normalizeDraft({
  sku: "PA-0041",
  title: "Pokemon Test Card MP",
  description: "Exact card pictured.",
  categoryId: "183454",
  cardCondition: "Moderately Played",
  conditionDescription: "Visible wear.",
  price: 3.49,
  aspects: { Game: ["Pokémon TCG"] },
  imageUrls: [],
});

test("art and illustration rares enforce the Pocket Archives $4.99 floor", () => {
  for (const rarity of ["Art Rare", "Illustration Rare", "Special Illustration Rare"]) {
    const draft = normalizeDraft({
      sku: "PA-AR-TEST",
      title: "Pokemon Art Rare Test",
      description: "Exact card pictured.",
      categoryId: "183454",
      cardCondition: "Near Mint",
      price: 2.49,
      aspects: { Game: ["Pokémon TCG"], Rarity: [rarity] },
      imageUrls: [],
    });
    assert.equal(draft.price, "4.99");
  }
});

test("draft normalization binds the verification certificate to its exact image pair", () => {
  const draft = normalizeDraft({
    sku: "PA-CERT-TEST",
    title: "Pokemon Eevee SVP 173 Holo NM",
    description: "Exact card pictured.",
    categoryId: "183454",
    cardCondition: "Near Mint",
    price: 5.99,
    aspects: { Game: ["Pokémon"] },
    imageUrls: ["https://example.com/front.jpg", "https://example.com/back.jpg"],
    verification: { mode: "HUMAN_REVIEWED", reviewedBy: "Adam", imageUrls: [] },
  });
  assert.deepEqual(draft.verification.imageUrls, draft.imageUrls);
});

test("the eBay mutation gate defaults to draft-only and requires explicit elevated modes", () => {
  assert.doesNotThrow(() =>
    assertDraftOnlyMutation("POST", "/sell/inventory/v1/location/pocket-archives-33067"),
  );
  assert.doesNotThrow(() =>
    assertDraftOnlyMutation("PUT", "/sell/inventory/v1/inventory_item/PA-0041"),
  );
  assert.doesNotThrow(() =>
    assertDraftOnlyMutation("POST", "/sell/inventory/v1/offer"),
  );
  assert.throws(
    () => assertDraftOnlyMutation("POST", "/sell/inventory/v1/offer/123/publish"),
    /Blocked eBay publish mutation/,
  );
  assert.throws(
    () => assertDraftOnlyMutation("POST", "/sell/inventory/v1/bulk_publish_offer"),
    /Blocked eBay publish mutation/,
  );
  assert.doesNotThrow(
    () => assertDraftOnlyMutation("POST", "/sell/inventory/v1/bulk_publish_offer", "publish"),
  );
  assert.throws(
    () => assertDraftOnlyMutation("DELETE", "/sell/inventory/v1/offer/123", "publish"),
    /Blocked eBay manage mutation/,
  );
  assert.doesNotThrow(
    () => assertDraftOnlyMutation("DELETE", "/sell/inventory/v1/offer/123", "manage"),
  );
  assert.throws(
    () => assertDraftOnlyMutation("POST", "/sell/inventory/v1/offer", "off"),
    /Blocked eBay draft mutation/,
  );
});

test("card condition IDs are resolved from live-style metadata instead of hardcoded", () => {
  const resolved = findCardConditionDescriptor(
    {
      itemConditionPolicies: [
        {
          categoryId: "183454",
          itemConditions: [
            {
              conditionId: "4000",
              conditionEnumValue: "USED_VERY_GOOD",
              conditionDescriptors: [
                {
                  conditionDescriptorId: "40001",
                  conditionDescriptorName: "Card Condition",
                  conditionDescriptorValues: [
                    {
                      conditionDescriptorValueId: "400015",
                      conditionDescriptorValueName: "Moderately played (Very good)",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    "183454",
    "MP - Moderately Played",
  );

  assert.equal(resolved.condition, "USED_VERY_GOOD");
  assert.deepEqual(resolved.conditionDescriptors, [
    { name: "40001", values: ["400015"] },
  ]);
});

test("draft payload uses the Pocket Archives package measurements", () => {
  const item = buildInventoryItem(normalizedDraft, {
    condition: "USED_VERY_GOOD",
    conditionDescriptors: [{ name: "40001", values: ["400015"] }],
  });
  assert.deepEqual(item.packageWeightAndSize, {
    dimensions: { height: 0.2, length: 7, width: 5, unit: "INCH" },
    packageType: "LETTER",
    weight: { unit: "POUND", value: 0.1 },
  });
});

test("offer remains unpublished and references existing account policies", () => {
  const offer = buildOffer(normalizedDraft, {
    merchantLocationKey: "pocket-archives",
    fulfillmentPolicyId: "fulfillment",
    freeFulfillmentPolicyId: "free-fulfillment",
    paymentPolicyId: "payment",
    returnPolicyId: "returns",
  });
  assert.equal(offer.sku, "PA-0041");
  assert.equal(offer.pricingSummary.price.value, "3.49");
  assert.equal("publish" in offer, false);
  assert.equal("status" in offer, false);
});

test("offer selects paid, free, and tracked shipping at the configured thresholds", () => {
  const config = {
    merchantLocationKey: "pocket-archives",
    fulfillmentPolicyId: "paid",
    freeFulfillmentPolicyId: "free",
    trackedFulfillmentPolicyId: "tracked",
    paymentPolicyId: "payment",
    returnPolicyId: "returns",
  };
  const at = (price) => buildOffer({ ...normalizedDraft, price: price.toFixed(2) }, config)
    .listingPolicies.fulfillmentPolicyId;
  assert.equal(at(4.98), "paid");
  assert.equal(at(4.99), "free");
  assert.equal(at(19.99), "free");
  assert.equal(at(20), "tracked");
});

test("order export excludes buyer personal information", () => {
  const orders = sanitizeOrders({
    orders: [
      {
        orderId: "ORDER-1",
        buyer: { username: "private-buyer" },
        fulfillmentStartInstructions: [{ shippingStep: { shipTo: { fullName: "Private Person" } } }],
        orderFulfillmentStatus: "FULFILLED",
        lineItems: [{ lineItemId: "1", sku: "PA-0041", title: "Card", quantity: 1 }],
      },
    ],
  });
  const serialized = JSON.stringify(orders);
  assert.match(serialized, /FULFILLED/);
  assert.doesNotMatch(serialized, /private-buyer|Private Person|shipTo|buyer/);
});
