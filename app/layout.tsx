import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketarchives.com"),
  title: "Pocket Archives — Pokémon Design History & Production Art",
  description: "Explore Pokémon prototypes, character sketches, production sheets, and a guided museum of creature-design history.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
