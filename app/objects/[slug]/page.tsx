import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoInventory, inventoryBySlug } from "../../shop/catalog";
import { ArtifactPage } from "../../shop/shop-client";

export function generateStaticParams() {
  return demoInventory.map((item) => ({ slug: item.slug }));
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
  return <ArtifactPage item={item} />;
}
