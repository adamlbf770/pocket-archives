import { demoInventory } from "./catalog";
import { carddassShopStock } from "./carddass-stock";
import { toppsShopStock } from "./topps-stock";

export const shopInventory = [...demoInventory, ...carddassShopStock, ...toppsShopStock];

export function shopInventoryBySlug(slug: string) {
  return shopInventory.find((item) => item.slug === slug && !item.demo);
}
