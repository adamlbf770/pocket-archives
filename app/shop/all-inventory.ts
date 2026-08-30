import { demoInventory } from "./catalog";
import { carddassShopStock } from "./carddass-stock";

export const shopInventory = [...demoInventory, ...carddassShopStock];

export function shopInventoryBySlug(slug: string) {
  return shopInventory.find((item) => item.slug === slug && !item.demo);
}
