import { GlobalHeader } from "./site-navigation";
import { featuredEbayListings, publicEbayListings, storefrontCounts } from "./ebay-storefront-data";
import { StorefrontHome } from "./ebay-storefront";

export default function HomePage() {
  const featured = featuredEbayListings();
  const hero = featured.find((item) => item.name === "Eevee") || featured[0];
  const categories = ["Pokémon", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"]
    .map((game) => publicEbayListings.find((item) => item.game === game))
    .filter((item): item is (typeof publicEbayListings)[number] => Boolean(item));

  return (
    <main className="ebay-storefront">
      <GlobalHeader active="home" />
      <StorefrontHome
        hero={hero}
        categories={categories}
        counts={storefrontCounts()}
        total={publicEbayListings.length}
      />
      <footer className="ebay-footer"><b>POCKET ARCHIVES</b><span>Independent collectibles shop · New York</span></footer>
    </main>
  );
}
