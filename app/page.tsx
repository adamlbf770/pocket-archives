import { GlobalHeader } from "./site-navigation";
import { featuredEbayListings, publicEbayListings, storefrontCounts } from "./ebay-storefront-data";
import { StorefrontHome } from "./ebay-storefront";
import { EXTERNAL_SHOP_URL } from "./shop/catalog";

function uniqueCardNames(items: (typeof publicEbayListings)[number][]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const displayName = item.game === "Pokémon"
      ? item.name.replace(/\b(?:ex|gx|vmax|vstar|v-union|break|lv\.?\s*x|v)\b/giu, " ")
      : item.name;
    const key = `${item.game}:${displayName}`.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function HomePage() {
  const featured = featuredEbayListings();
  const heroSlides = uniqueCardNames(
    [featured.find((item) => item.name === "Eevee"), ...featured]
      .filter((item): item is (typeof publicEbayListings)[number] => Boolean(item)),
  ).slice(0, 6);
  const categories = ["Pokémon", "One Piece Card Game", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"]
    .map((game) => publicEbayListings.find((item) => item.game === game))
    .filter((item): item is (typeof publicEbayListings)[number] => Boolean(item));
  const curatedByGame = ["Pokémon", "One Piece Card Game", "Dragon Ball Super", "Magic: The Gathering", "Riftbound"]
    .map((game) => uniqueCardNames(publicEbayListings.filter((item) => item.game === game)).slice(0, 18));
  const curated = Array.from({ length: Math.max(...curatedByGame.map((items) => items.length)) })
    .flatMap((_, index) => curatedByGame.map((items) => items[index]).filter((item): item is (typeof publicEbayListings)[number] => Boolean(item)));

  return (
    <main className="ebay-storefront">
      <GlobalHeader active="home" />
      <StorefrontHome
        featured={heroSlides}
        curated={curated}
        categories={categories}
        counts={storefrontCounts()}
        total={publicEbayListings.length}
      />
      <footer className="archive-footer">
        <div><b>POCKET ARCHIVES</b><p>Trading cards, cataloged in New York.</p></div>
        <nav aria-label="Footer navigation"><a href="/shop">Browse cards</a><a href="/about">About the archive</a><a href={EXTERNAL_SHOP_URL} target="_blank" rel="noreferrer">eBay store ↗</a></nav>
      </footer>
    </main>
  );
}
