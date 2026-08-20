import type { Metadata } from "next";
import { ArchiveExperience } from "../page";

export const metadata: Metadata = {
  title: "The Archive — Pocket Archives",
  description:
    "Explore Pokémon design history through early concepts, character sketches, production sheets, and a guided historical exhibition.",
};

export default function ArchivePage() {
  return <ArchiveExperience />;
}
