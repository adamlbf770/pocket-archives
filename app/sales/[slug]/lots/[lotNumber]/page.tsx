import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoSales, lotByNumber, lotsForSale, objectForLot, saleBySlug } from "../../../sale-data";
import { LotDetail } from "../../../sales-client";

export function generateStaticParams() {
  return demoSales.flatMap((sale) => lotsForSale(sale.id).map((lot) => ({ slug: sale.slug, lotNumber: String(lot.lotNumber).padStart(2, "0") })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lotNumber: string }> }): Promise<Metadata> {
  const { slug, lotNumber } = await params;
  const sale = saleBySlug(slug);
  const lot = sale ? lotByNumber(sale.id, Number(lotNumber)) : undefined;
  const item = lot ? objectForLot(lot) : undefined;
  return sale && lot && item ? { title: `Lot ${String(lot.lotNumber).padStart(2, "0")} · ${item.title} — ${sale.title}`, description: item.description } : {};
}

export default async function LotPage({ params }: { params: Promise<{ slug: string; lotNumber: string }> }) {
  const { slug, lotNumber } = await params;
  const sale = saleBySlug(slug);
  const lot = sale ? lotByNumber(sale.id, Number(lotNumber)) : undefined;
  const item = lot ? objectForLot(lot) : undefined;
  if (!sale || !lot || !item) notFound();
  return <LotDetail sale={sale} lot={lot} item={item} />;
}

