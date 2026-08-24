import fs from "node:fs/promises";
import path from "node:path";
import { ebayRequest } from "./api.mjs";

const apply = process.argv.includes("--apply");
const root = path.resolve(import.meta.dirname, "../..");
const sku = "PA-0881";
const expectedOldTitle = "Dragon Ball Super Fusion World Son Goku FB04-035 Ultra Limit NM";
const draftPath = path.join(root, "outputs/dbz_batch13_review/ebay-drafts", `${sku}.json`);
const recordPath = path.join(root, "data/ebay/drafts", `${sku}.json`);
const draft = JSON.parse(await fs.readFile(draftPath, "utf8"));
const record = JSON.parse(await fs.readFile(recordPath, "utf8"));

const [item, offer] = await Promise.all([
  ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`),
  ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(record.offerId)}`),
]);

if (offer.sku !== sku) throw new Error(`Safety stop: offer belongs to ${offer.sku}.`);
if (![expectedOldTitle, draft.title].includes(item.product?.title)) {
  throw new Error(`Safety stop: unexpected current title: ${item.product?.title}`);
}

console.log(JSON.stringify({
  sku,
  listingId: record.listingId,
  currentTitle: item.product.title,
  correctedTitle: draft.title,
  action: apply ? "update" : "dry-run",
}, null, 2));

if (!apply) process.exit(0);

const itemPayload = structuredClone(item);
delete itemPayload.sku;
delete itemPayload.locale;
delete itemPayload.availability?.shipToLocationAvailability?.allocationByFormat;
delete itemPayload.packageWeightAndSize?.shippingIrregular;
itemPayload.product = {
  ...itemPayload.product,
  title: draft.title,
  description: draft.description,
  aspects: {
    ...itemPayload.product.aspects,
    "Card Name": draft.aspects["Card Name"],
    "Card Number": draft.aspects["Card Number"],
    Rarity: draft.aspects.Rarity,
  },
};
await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
  method: "PUT",
  body: JSON.stringify(itemPayload),
});

const offerPayload = structuredClone(offer);
for (const field of ["offerId", "status", "listing", "listingId"]) delete offerPayload[field];
offerPayload.listingDescription = draft.description;
await ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(record.offerId)}`, {
  method: "PUT",
  body: JSON.stringify(offerPayload),
});

const verified = await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
if (verified.product?.title !== draft.title) throw new Error("eBay verification failed after update.");
console.log(`Corrected ${sku} to Son Goten FB04-036 on eBay.`);
