import type { Metadata } from "next";
import { GlobalHeader } from "../site-navigation";
import { EbayCatalog } from "../ebay-storefront";
import { publicEbayListings, storefrontCatalogListings } from "../ebay-storefront-data";

export const metadata: Metadata = {
  title: "Shop — Pocket Archives",
  description: "Browse the current Pocket Archives eBay inventory by card, set, game, artist, condition, and price.",
  openGraph: { title: "Pocket Archives eBay Storefront", description: "Vintage cards, new finds, and actual-item photography from Pocket Archives.", images: ["/og-shop.png"] },
  twitter: { card: "summary_large_image", title: "Pocket Archives eBay Storefront", description: "Vintage cards, new finds, and actual-item photography from Pocket Archives.", images: ["/og-shop.png"] },
};

export default async function ShopPage({ searchParams }: { searchParams?: Promise<{ game?: string }> }) {
  const params = searchParams ? await searchParams : {};
  return (
    <main className="ebay-storefront">
      <GlobalHeader active="shop" />
      <EbayCatalog listings={storefrontCatalogListings()} total={publicEbayListings.length} initialGame={params.game || "all"} />
      <footer className="ebay-footer"><b>POCKET ARCHIVES</b><span>Purchases are completed securely on eBay.</span></footer>
    </main>
  );
}
