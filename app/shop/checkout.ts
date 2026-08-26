import type { InventoryItem } from "./catalog";

const STRIPE_CHECKOUT_LINKS: Record<string, string> = {
  "PA-0014": "https://buy.stripe.com/5kQaEQ2i22Xl2Ayeum6g800",
  "PA-0015": "https://buy.stripe.com/14AaEQe0KfK71wu85Y6g801",
  "PA-0040": "https://buy.stripe.com/8x2dR2cWG9lJejg9a26g802",
};

export function stripeCheckoutUrl(item: InventoryItem) {
  return STRIPE_CHECKOUT_LINKS[item.accessionNumber];
}
