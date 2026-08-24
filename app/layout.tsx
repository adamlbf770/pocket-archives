import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketarchives.com"),
  title: "Pocket Archives — Curated Trading Cards & Collecting Culture",
  description:
    "An independent shop for trading cards, curated collections, vintage material, and collectible ephemera.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
