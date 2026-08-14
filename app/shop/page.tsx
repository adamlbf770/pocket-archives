import type { Metadata } from "next";
import { ShopLanding } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop — Pocket Archives",
  description: "A collector gallery for interesting cards, objects, curated collections, and Pocket Archives presentations.",
  openGraph: { title: "Pocket Archives Shop", description: "Objects worth keeping.", images: ["/og-shop.png"] },
  twitter: { card: "summary_large_image", title: "Pocket Archives Shop", description: "Objects worth keeping.", images: ["/og-shop.png"] },
};

export default function ShopPage() {
  return <ShopLanding />;
}
