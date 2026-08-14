import type { Metadata } from "next";
import { ShopLanding } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop — Pocket Archives",
  description: "Vintage Pokémon cards, promos, and sets.",
  openGraph: { title: "Pocket Archives Shop", description: "Collector. Curator. Dealer.", images: ["/og-shop.png"] },
  twitter: { card: "summary_large_image", title: "Pocket Archives Shop", description: "Collector. Curator. Dealer.", images: ["/og-shop.png"] },
};

export default function ShopPage() {
  return <ShopLanding />;
}
