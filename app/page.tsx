import { GlobalHeader } from "./site-navigation";
import { featuredEbayListings, publicEbayListings, storefrontCounts } from "./ebay-storefront-data";
import { StorefrontHome } from "./ebay-storefront";
import { EXTERNAL_SHOP_URL } from "./shop/catalog";

export default function HomePage() {
  const featured = featuredEbayListings();
  const heroSlides = [featured.find((item) => item.name === "Eevee"), ...featured]
    .filter((item): item is (typeof publicEbayListings)[number] => Boolean(item))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.sku === item.sku) === index)
    .slice(0, 6);
  const categories = ["Pokémon", "One Piece Card Game", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"]
    .map((game) => publicEbayListings.find((item) => item.game === game))
    .filter((item): item is (typeof publicEbayListings)[number] => Boolean(item));

  return (
    <main className="ebay-storefront">
      <GlobalHeader active="home" />
      <StorefrontHome
        featured={heroSlides}
        categories={categories}
        counts={storefrontCounts()}
        total={publicEbayListings.length}
      />
      <footer className="archive-footer">
        <div><b>POCKET ARCHIVES</b><p>Individually scanned trading cards, cataloged in New York and sold through eBay.</p></div>
        <nav aria-label="Footer navigation"><a href="/shop">Browse cards</a><a href="/about">About the archive</a><a href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">eBay store ↗</a></nav>
        <small>Actual cards. Actual scans. Straightforward condition notes.</small>
      </footer>
    </main>
  );
}
