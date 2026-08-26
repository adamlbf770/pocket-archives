import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { demoInventory, EXTERNAL_SHOP_URL, inventoryBySlug } from "../../shop/catalog";
import { stripeCheckoutUrl } from "../../shop/checkout";
import { ArtifactPage } from "../../shop/shop-client";

export function generateStaticParams() {
  return demoInventory.filter((item) => !item.demo).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = inventoryBySlug(slug);
  return item ? { title: `${item.accessionNumber} · ${item.title} — Pocket Archives Shop`, description: item.description, openGraph: { images: ["/og-shop.png"] }, twitter: { card: "summary_large_image", images: ["/og-shop.png"] } } : {};
}

export default async function ObjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = inventoryBySlug(slug);
  if (!item) notFound();
  if (
    ["Cards", "Carddass", "Promos"].includes(item.category) &&
    !stripeCheckoutUrl(item)
  ) {
    redirect(EXTERNAL_SHOP_URL);
  }
  return <ArtifactPage item={item} />;
}
