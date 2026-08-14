import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionExperience } from "../../shop/shop-client";
import { collectionBySlug, storeCollections } from "../../shop/storefront-data";

export function generateStaticParams() { return storeCollections.map((collection) => ({ slug: collection.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  return collection ? { title: `${collection.title} — Pocket Archives Shop`, description: collection.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();
  return <CollectionExperience collection={collection} />;
}

