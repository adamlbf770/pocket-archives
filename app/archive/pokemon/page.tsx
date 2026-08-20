import type { Metadata } from "next";
import { ArchiveExperience } from "../../page";

export const metadata: Metadata = {
  title: "The History of Pokémon — Pocket Archives",
  description:
    "The complete Pocket Archives Pokémon history: development drawings, character studies, production sheets, sprites, and a guided chronological exhibition.",
};

export default function PokemonHistoryPage() {
  return <ArchiveExperience />;
}
