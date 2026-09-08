export const MARKETPLACE_ID = "EBAY_US";
export const TRADING_CARD_CATEGORY_ID = "183454";
export const MINIMUM_LISTING_PRICE = 1.49;
export const ART_RARE_MINIMUM_LISTING_PRICE = 4.99;
export const FREE_SHIPPING_THRESHOLD = 4.99;
export const TRACKED_SHIPPING_THRESHOLD = 20;
export const REQUIRED_OAUTH_SCOPES = Object.freeze([
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
]);

const MUTATING_PATHS = Object.freeze([
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/location\/[^/]+$/, capability: "draft" },
  { method: "PUT", pattern: /^\/sell\/inventory\/v1\/inventory_item\/[^/]+$/, capability: "draft" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/offer$/, capability: "draft" },
  { method: "PUT", pattern: /^\/sell\/inventory\/v1\/offer\/[^/]+$/, capability: "draft" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/bulk_create_or_replace_inventory_item$/, capability: "draft" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/offer\/[^/]+\/publish$/, capability: "publish" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/bulk_publish_offer$/, capability: "publish" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/offer\/[^/]+\/withdraw$/, capability: "manage" },
  { method: "POST", pattern: /^\/sell\/inventory\/v1\/bulk_update_price_quantity$/, capability: "manage" },
  { method: "DELETE", pattern: /^\/sell\/inventory\/v1\/offer\/[^/]+$/, capability: "manage" },
  { method: "DELETE", pattern: /^\/sell\/inventory\/v1\/inventory_item\/[^/]+$/, capability: "manage" },
]);
const WRITE_LEVEL = Object.freeze({ off: 0, draft: 1, publish: 2, manage: 3 });

export function assertDraftOnlyMutation(
  method,
  path,
  writeMode = process.env.POCKET_ARCHIVES_EBAY_WRITE_MODE ?? "draft",
) {
  const normalizedMethod = method.toUpperCase();
  const mutation = MUTATING_PATHS.find(
    (entry) => entry.method === normalizedMethod && entry.pattern.test(path),
  );
  const normalizedMode = String(writeMode).trim().toLowerCase();
  if (!(normalizedMode in WRITE_LEVEL)) {
    throw new Error(
      `Invalid POCKET_ARCHIVES_EBAY_WRITE_MODE "${writeMode}". Use off, draft, publish, or manage.`,
    );
  }
  if (!mutation || WRITE_LEVEL[normalizedMode] < WRITE_LEVEL[mutation.capability]) {
    throw new Error(
      `Blocked eBay ${mutation?.capability ?? "unknown"} mutation: ${normalizedMethod} ${path}. Current write mode is ${normalizedMode}.`,
    );
  }
}

export function normalizeDraft(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Draft input must be a JSON object.");
  }

  const requiredStrings = ["sku", "title", "description", "categoryId", "cardCondition"];
  for (const field of requiredStrings) {
    if (typeof raw[field] !== "string" || !raw[field].trim()) {
      throw new Error(`Draft field ${field} is required.`);
    }
  }

  const price = Number(raw.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Draft price must be a positive number.");
  }

  const quantity = raw.quantity == null ? 1 : Number(raw.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Draft quantity must be a non-negative integer.");
  }

  if (!raw.aspects || typeof raw.aspects !== "object" || Array.isArray(raw.aspects)) {
    throw new Error("Draft aspects must be an object of eBay item-specific arrays.");
  }

  const aspects = {};
  for (const [name, values] of Object.entries(raw.aspects)) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string")) {
      throw new Error(`Aspect ${name} must be a non-empty array of strings.`);
    }
    aspects[name] = values.map((value) => value.trim()).filter(Boolean);
  }

  const imageUrls = raw.imageUrls == null ? [] : raw.imageUrls;
  if (!Array.isArray(imageUrls) || imageUrls.some((url) => !isHttpsUrl(url))) {
    throw new Error("Every image URL must use HTTPS.");
  }

  const rarityValues = Object.entries(aspects)
    .filter(([name]) => /^(?:card\s+)?rarity$/i.test(name.trim()))
    .flatMap(([, values]) => values);
  const isArtRare = rarityValues.some((value) =>
    /\b(?:art|illustration)\s+rare\b/i.test(value),
  );
  const normalizedPrice = Math.max(
    price,
    isArtRare ? ART_RARE_MINIMUM_LISTING_PRICE : MINIMUM_LISTING_PRICE,
  );
  const shippingProfile = raw.shippingProfile === "TRACKED" ? "TRACKED" : "STANDARD";
  let grading = null;
  if (raw.cardCondition.trim().toLowerCase() === "graded") {
    grading = raw.grading;
    for (const field of ["grader", "grade", "certificationNumber"]) {
      if (!grading || typeof grading[field] !== "string" || !grading[field].trim()) {
        throw new Error(`Draft grading.${field} is required for a graded card.`);
      }
    }
    grading = Object.fromEntries(Object.entries(grading).map(([key, value]) => [key, value.trim()]));
  }
  return {
    sku: raw.sku.trim(),
    title: raw.title.trim(),
    description: raw.description.trim(),
    categoryId: raw.categoryId.trim(),
    cardCondition: raw.cardCondition.trim(),
    conditionDescription:
      typeof raw.conditionDescription === "string" ? raw.conditionDescription.trim() : "",
    price: normalizedPrice.toFixed(2),
    quantity,
    aspects,
    imageUrls,
    shippingProfile,
    ...(raw.verification && typeof raw.verification === "object"
      ? { verification: { ...structuredClone(raw.verification), imageUrls: [...imageUrls] } }
      : {}),
    ...(grading ? { grading } : {}),
  };
}

export function findCardConditionDescriptor(policyResponse, categoryId, cardCondition, grading = null) {
  const policy = policyResponse?.itemConditionPolicies?.find(
    (entry) => String(entry.categoryId) === String(categoryId),
  );
  if (!policy) throw new Error(`eBay returned no condition policy for category ${categoryId}.`);

  if (String(cardCondition).trim().toLowerCase() === "graded") {
    const graded = policy.itemConditions?.find((condition) => String(condition.conditionId) === "2750");
    if (!graded) throw new Error(`Category ${categoryId} does not support the Graded card condition.`);
    const descriptors = graded.conditionDescriptors ?? [];
    const graderDescriptor = descriptors.find((entry) => entry.conditionDescriptorName === "Professional Grader");
    const gradeDescriptor = descriptors.find((entry) => entry.conditionDescriptorName === "Grade");
    const certDescriptor = descriptors.find((entry) => entry.conditionDescriptorName === "Certification Number");
    const graderAliases = {
      PSA: "Professional Sports Authenticator (PSA)",
      CGC: "Certified Guaranty Company (CGC)",
      "WA GENUINE": "Other",
    };
    const graderName = graderAliases[String(grading?.grader).toUpperCase()] ?? grading?.grader;
    const graderValue = graderDescriptor?.conditionDescriptorValues?.find(
      (entry) => entry.conditionDescriptorValueName === graderName,
    );
    const gradeValue = gradeDescriptor?.conditionDescriptorValues?.find(
      (entry) => entry.conditionDescriptorValueName === String(grading?.grade),
    );
    if (!graderValue || !gradeValue || !certDescriptor) {
      throw new Error(`Unsupported graded-card descriptors: ${grading?.grader} ${grading?.grade}.`);
    }
    return {
      condition: "LIKE_NEW",
      conditionDescriptors: [
        { name: String(graderDescriptor.conditionDescriptorId), values: [String(graderValue.conditionDescriptorValueId)] },
        { name: String(gradeDescriptor.conditionDescriptorId), values: [String(gradeValue.conditionDescriptorValueId)] },
        { name: String(certDescriptor.conditionDescriptorId), additionalInfo: String(grading.certificationNumber) },
      ],
    };
  }

  const ungraded = policy.itemConditions?.find(
    (condition) => String(condition.conditionId) === "4000",
  );
  if (!ungraded) throw new Error(`Category ${categoryId} does not support the Ungraded card condition.`);

  const descriptor = ungraded.conditionDescriptors?.find(
    (entry) => entry.conditionDescriptorName?.toLowerCase() === "card condition",
  );
  if (!descriptor) throw new Error(`Category ${categoryId} has no Card Condition descriptor.`);

  const normalizedWanted = normalizeConditionName(cardCondition);
  const value = descriptor.conditionDescriptorValues?.find(
    (entry) => normalizeConditionName(entry.conditionDescriptorValueName) === normalizedWanted,
  );
  if (!value) {
    const supported = (descriptor.conditionDescriptorValues ?? [])
      .map((entry) => entry.conditionDescriptorValueName)
      .filter(Boolean)
      .join(", ");
    throw new Error(`Unsupported card condition "${cardCondition}". eBay supports: ${supported}`);
  }

  return {
    condition: ungraded.conditionEnumValue ?? "USED_VERY_GOOD",
    conditionDescriptors: [
      {
        name: String(descriptor.conditionDescriptorId),
        values: [String(value.conditionDescriptorValueId)],
      },
    ],
  };
}

export function buildInventoryItem(draft, resolvedCondition) {
  const tracked = draft.shippingProfile === "TRACKED" || Number(draft.price) >= TRACKED_SHIPPING_THRESHOLD;
  return {
    availability: { shipToLocationAvailability: { quantity: draft.quantity } },
    condition: resolvedCondition.condition,
    conditionDescriptors: resolvedCondition.conditionDescriptors,
    ...(draft.conditionDescription
      ? { conditionDescription: draft.conditionDescription }
      : {}),
    packageWeightAndSize: {
      dimensions: tracked
        ? { height: 0.5, length: 7, width: 5, unit: "INCH" }
        : { height: 0.2, length: 7, width: 5, unit: "INCH" },
      packageType: tracked ? "PACKAGE_THICK_ENVELOPE" : "LETTER",
      weight: { unit: "POUND", value: tracked ? 0.25 : 0.1 },
    },
    product: {
      title: draft.title,
      description: draft.description,
      aspects: draft.aspects,
      ...(draft.imageUrls.length ? { imageUrls: draft.imageUrls } : {}),
    },
  };
}

export function buildOffer(draft, accountConfig) {
  for (const field of [
    "merchantLocationKey",
    "fulfillmentPolicyId",
    "freeFulfillmentPolicyId",
    "paymentPolicyId",
    "returnPolicyId",
  ]) {
    if (!accountConfig?.[field]) {
      throw new Error(`Account configuration is missing ${field}. Run npm run ebay:sync.`);
    }
  }

  return {
    sku: draft.sku,
    marketplaceId: MARKETPLACE_ID,
    format: "FIXED_PRICE",
    availableQuantity: draft.quantity,
    categoryId: draft.categoryId,
    listingDescription: draft.description,
    listingDuration: "GTC",
    merchantLocationKey: accountConfig.merchantLocationKey,
    listingPolicies: {
      fulfillmentPolicyId:
        draft.shippingProfile === "TRACKED" || Number(draft.price) >= TRACKED_SHIPPING_THRESHOLD
          ? accountConfig.trackedFulfillmentPolicyId
          : Number(draft.price) >= FREE_SHIPPING_THRESHOLD
            ? accountConfig.freeFulfillmentPolicyId
          : accountConfig.fulfillmentPolicyId,
      paymentPolicyId: accountConfig.paymentPolicyId,
      returnPolicyId: accountConfig.returnPolicyId,
    },
    pricingSummary: { price: { currency: "USD", value: draft.price } },
  };
}

export function sanitizeOrders(response) {
  return (response?.orders ?? []).map((order) => ({
    orderId: order.orderId ?? "",
    creationDate: order.creationDate ?? "",
    lastModifiedDate: order.lastModifiedDate ?? "",
    orderFulfillmentStatus: order.orderFulfillmentStatus ?? "",
    orderPaymentStatus: order.orderPaymentStatus ?? "",
    lineItems: (order.lineItems ?? []).map((line) => ({
      lineItemId: line.lineItemId ?? "",
      legacyItemId: line.legacyItemId ?? "",
      sku: line.sku ?? "",
      title: line.title ?? "",
      quantity: line.quantity ?? 0,
      total: line.lineItemCost?.value ?? "",
      currency: line.lineItemCost?.currency ?? "",
    })),
  }));
}

function normalizeConditionName(value) {
  const normalized = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const aliases = {
    nm: "near mint",
    lp: "lightly played",
    mp: "moderately played",
    hp: "heavily played",
    dmg: "damaged",
  };
  for (const canonical of [
    "near mint",
    "lightly played",
    "moderately played",
    "heavily played",
    "damaged",
  ]) {
    if (normalized.startsWith(canonical)) return canonical;
  }
  const words = normalized.split(" ");
  if (aliases[normalized]) return aliases[normalized];
  if (aliases[words[0]]) return aliases[words[0]];
  return normalized;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
