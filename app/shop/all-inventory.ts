import { demoInventory } from "./catalog";
import { carddassShopStock } from "./carddass-stock";
import { toppsShopStock } from "./topps-stock";

const soldOnEbayAccessions = new Set(["PA-0014", "PA-0015", "PA-0040"]);

export const shopInventory = [...demoInventory, ...carddassShopStock, ...toppsShopStock]
  .filter((item) => !soldOnEbayAccessions.has(item.accessionNumber));

export function shopInventoryBySlug(slug: string) {
  return shopInventory.find((item) => item.slug === slug && !item.demo);
}
