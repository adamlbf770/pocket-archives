import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoSales, saleBySlug } from "../sale-data";
import { SaleCatalog } from "../sales-client";

export function generateStaticParams() { return demoSales.map((sale) => ({ slug: sale.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sale = saleBySlug(slug);
  return sale ? { title: `Sale ${String(sale.saleNumber).padStart(3, "0")} — ${sale.title} · Pocket Archives`, description: sale.description } : {};
}

export default async function SalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sale = saleBySlug(slug);
  if (!sale) notFound();
  return <SaleCatalog sale={sale} />;
}

