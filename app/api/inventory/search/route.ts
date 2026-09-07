import { NextRequest, NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { inventoryRecords } from "../../../inventory/catalog.generated";
import { readInventoryLiveState } from "../../../../db/inventory-live";

export const dynamic = "force-dynamic";

type RecordRow = {
  sku: string; name: string; game: string; set: string; number: string; artist: string;
  boxId: string; status: string; price: number | null; listingId: string | null;
  listingUrl: string | null; [key: string]: unknown;
};

type LiveRow = {
  sku: string; status: string; price: number | null; listingId: string | null; listingUrl: string | null;
};

const records = inventoryRecords as unknown as readonly RecordRow[];
let liveCache: { expiresAt: number; rows: LiveRow[] } | null = null;

function skuNumber(sku: string) { return Number(sku.replace(/\D/g, "")) || 0; }
function searchRank(record: RecordRow, needle: string) {
  if (!needle) return 0;
  const name = record.name.toLowerCase();
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 60;
  if (record.sku.toLowerCase() === needle) return 55;
  if (record.sku.toLowerCase().includes(needle)) return 45;
  if (record.number.toLowerCase() === needle) return 40;
  if (record.artist.toLowerCase().includes(needle)) return 30;
  if (record.set.toLowerCase().includes(needle)) return 20;
  return -1;
}

async function liveRows(force: boolean) {
  if (!force && liveCache && liveCache.expiresAt > Date.now()) return liveCache.rows;
  const snapshot = await readInventoryLiveState();
  const rows = snapshot.rows as LiveRow[];
  liveCache = { rows, expiresAt: Date.now() + 15_000 };
  return rows;
}

function merge(record: RecordRow, live: LiveRow | undefined) {
  if (!live) return record;
  return {
    ...record,
    status: live.status,
    price: live.price ?? record.price,
    listingId: live.listingId ?? record.listingId,
    listingUrl: live.listingUrl ?? record.listingUrl,
  };
}

export async function GET(request: NextRequest) {
  const user = await getChatGPTUser();
  const owner = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  if (!user || user.email.toLowerCase() !== owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const box = request.nextUrl.searchParams.get("box") ?? "all";
  const game = request.nextUrl.searchParams.get("game") ?? "all";
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const limit = Math.min(120, Math.max(30, Number(request.nextUrl.searchParams.get("limit")) || 30));
  const force = request.nextUrl.searchParams.get("fresh") === "1";
  const live = await liveRows(force);
  const liveBySku = new Map(live.map((row) => [row.sku, row]));
  const merged = records.map((record) => merge(record, liveBySku.get(record.sku)));
  const ranked = merged
    .map((record) => ({ record, rank: searchRank(record, query) }))
    .filter(({ record, rank }) => rank >= 0 && (box === "all" || record.boxId === box) &&
      (game === "all" || record.game === game) && (status === "all" || record.status === status))
    .sort((a, b) => query ? b.rank - a.rank || skuNumber(b.record.sku) - skuNumber(a.record.sku) : skuNumber(b.record.sku) - skuNumber(a.record.sku));
  const listed = merged.filter((record) => record.status === "Listed");

  return NextResponse.json({
    records: ranked.slice(0, limit).map(({ record }) => record),
    total: ranked.length,
    summary: {
      totalCards: merged.length,
      listed: listed.length,
      unlisted: merged.length - listed.length,
      listedValue: listed.reduce((sum, record) => sum + (record.price ?? 0), 0),
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
