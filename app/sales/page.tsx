import type { Metadata } from "next";
import { SalesLanding } from "./sales-client";

export const metadata: Metadata = {
  title: "Sales — Pocket Archives",
  description: "Curated, occasional sales of Pokémon cards and collectible print pieces.",
};

export default function SalesPage() { return <SalesLanding />; }
