import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import InventoryCatalog from "./inventory-catalog";
import { inventoryBoxes, inventoryRecords, inventoryUpdatedAt } from "./catalog.generated";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory — Pocket Archives",
  description: "Private searchable inventory for Pocket Archives.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function InventoryPage() {
  const user = process.env.NODE_ENV === "production"
    ? await requireChatGPTUser("/inventory")
    : { email: "adamlbf@gmail.com", displayName: "Adam", userId: "local", fullName: "Adam" };
  const ownerEmail = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  if (user.email.toLowerCase() !== ownerEmail) notFound();

  return (
    <InventoryCatalog
      boxes={inventoryBoxes}
      records={inventoryRecords}
      updatedAt={inventoryUpdatedAt}
      ownerName={user.fullName || user.displayName}
    />
  );
}
