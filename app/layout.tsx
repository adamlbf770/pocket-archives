import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketarchives.com"),
  title: "Pocket Archives — Independent Collectibles on eBay",
  description:
    "Browse current Pocket Archives eBay listings: vintage trading cards, Japanese collectibles, graded cards, and new finds photographed individually.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
