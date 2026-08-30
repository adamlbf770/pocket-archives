import type { InventoryItem } from "./catalog";

const STRIPE_CHECKOUT_LINKS: Record<string, string> = {
  "PA-0041": "https://buy.stripe.com/4gM5kw9KueG3cb89a26g803",
  "PA-0042": "https://buy.stripe.com/3cI5kw3m6fK71wu3PI6g804",
  "PA-3642": "https://buy.stripe.com/5kQfZa2i2eG31wueum6g805",
  "PA-3645": "https://buy.stripe.com/9B6dR2aOydBZejg9a26g808",
  "PA-4388": "https://buy.stripe.com/dRmcMY8Gq1Tha30ae66g80b",
  "PA-TOPPS-028": "https://buy.stripe.com/14A28k6yi41p2Ayae66g809",
};

export function stripeCheckoutUrl(item: InventoryItem) {
  return STRIPE_CHECKOUT_LINKS[item.accessionNumber];
}
