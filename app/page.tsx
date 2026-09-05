import { GlobalHeader } from "./site-navigation";
import { featuredEbayListings, publicEbayListings, storefrontCounts } from "./ebay-storefront-data";
import { StorefrontHome } from "./ebay-storefront";

export default function HomePage() {
  const featured = featuredEbayListings();
  const featuredSkus = new Set(featured.map((item) => item.sku));
  const latest = publicEbayListings.filter((item) => !featuredSkus.has(item.sku)).slice(0, 8);

  return (
    <main className="ebay-storefront">
      <GlobalHeader active="home" />
      <StorefrontHome
        featured={featured}
        latest={latest}
        counts={storefrontCounts()}
        total={publicEbayListings.length}
      />
      <footer className="ebay-footer"><b>POCKET ARCHIVES</b><span>Independent collectibles shop · New York</span></footer>
    </main>
  );
}
