import Link from "next/link";
import { EXTERNAL_SHOP_URL } from "./shop/catalog";

type NavigationPage = "home" | "shop" | "about";

export function GlobalHeader({ active }: { active?: NavigationPage }) {
  const current = (page: NavigationPage) =>
    active === page ? ("page" as const) : undefined;

  const links = (
    <>
      <Link href="/" aria-current={current("home")}>Home</Link>
      <Link href="/shop" aria-current={current("shop")}>Shop</Link>
      <Link href="/about" aria-current={current("about")}>About</Link>
      <a className="global-ebay-link" href={EXTERNAL_SHOP_URL}>
        Cards on eBay <span aria-hidden="true">↗</span>
      </a>
    </>
  );

  return (
    <header className="global-header" id="top">
      <Link className="global-brand" href="/" aria-label="Pocket Archives home">
        <span className="brand-mark">
          <img src="/pocket-archives-logo.png" alt="" />
        </span>
        <span>
          <strong>POCKET ARCHIVES</strong>
          <small>Collectibles · collections · culture</small>
        </span>
      </Link>
      <nav className="global-desktop-nav" aria-label="Primary navigation">
        {links}
      </nav>
      <details className="global-mobile-menu">
        <summary aria-label="Open navigation menu">
          <span />
          <span />
          <span />
        </summary>
        <nav aria-label="Mobile navigation">{links}</nav>
      </details>
    </header>
  );
}
