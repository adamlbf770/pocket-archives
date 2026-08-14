import type { Metadata } from "next";
import { ShopLanding } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop — Pocket Archives",
  description: "Curated cards, artwork, and artifacts from the history of Pokémon.",
  openGraph: { title: "Pocket Archives Shop", description: "Collector. Curator. Dealer.", images: ["/og-shop.png"] },
  twitter: { card: "summary_large_image", title: "Pocket Archives Shop", description: "Collector. Curator. Dealer.", images: ["/og-shop.png"] },
};

export default function ShopPage() {
  return <ShopLanding />;
}
