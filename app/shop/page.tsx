import type { Metadata } from "next";
import { ShopLanding } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop — Pocket Archives",
  description: "Curated collections, vintage material, ephemera, and special grouped offerings from Pocket Archives.",
  openGraph: { title: "Pocket Archives Shop", description: "Curated collections and collectible material, selected with a reason.", images: ["/og-shop.png"] },
  twitter: { card: "summary_large_image", title: "Pocket Archives Shop", description: "Curated collections and collectible material, selected with a reason.", images: ["/og-shop.png"] },
};

export default function ShopPage() {
  return <ShopLanding />;
}
