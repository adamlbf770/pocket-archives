import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketarchives.com"),
  title: "Pocket Archives — Pokémon Sketches, Model Sheets & Pokédex",
  description: "Explore Pokémon production sketches, model sheets, character studies, and a complete illustrated Pokédex.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
