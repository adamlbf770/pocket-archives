import { env } from "cloudflare:workers";

export type InventoryLiveRow = {
  sku: string;
  status: string;
  price: number | null;
  listingId: string | null;
  listingUrl: string | null;
  quantityAvailable: number;
  soldAt: string | null;
  updatedAt: string;
};

export async function readInventoryLiveState() {
  const [rows, sync] = await Promise.all([
    env.DB.prepare(`
      SELECT sku, status, price, listing_id AS listingId,
        listing_url AS listingUrl, quantity_available AS quantityAvailable,
        sold_at AS soldAt, updated_at AS updatedAt
      FROM inventory_live_state
    `).all<InventoryLiveRow>(),
    env.DB.prepare(`
      SELECT updated_at AS updatedAt, active_count AS activeCount,
        sold_count AS soldCount, records_written AS recordsWritten, error
      FROM inventory_sync_state
      WHERE source = ?
    `).bind("ebay").first<{
      updatedAt: string;
      activeCount: number;
      soldCount: number;
      recordsWritten: number;
      error: string | null;
    }>(),
  ]);

  return { rows: rows.results ?? [], sync };
}
