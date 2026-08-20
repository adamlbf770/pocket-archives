import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketarchives.com"),
  title: "Pocket Archives — Curated Trading Cards & Collecting Culture",
  description:
    "An independent collector-led shop for vintage trading cards, printed material, and the stories behind what we collect.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
