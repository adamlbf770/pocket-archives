import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { readInventoryLiveState } from "../../../../db/inventory-live";

export const dynamic = "force-dynamic";

const EBAY_API = "https://api.ebay.com";
const EBAY_TRADING_API = "https://api.ebay.com/ws/api.dll";
const PAGE_SIZE = 200;
const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
].join(" ");

type ActiveListing = {
  sku: string;
  status: "Listed";
  price: number;
  listingId: string;
  listingUrl: string;
  quantityAvailable: number;
  soldAt: null;
  updatedAt: string;
};

type SoldListing = {
  sku: string;
  status: "Sold";
  price: number | null;
  listingId: string | null;
  listingUrl: string | null;
  quantityAvailable: 0;
  soldAt: string;
  updatedAt: string;
};

export async function GET() {
  const auth = await authorizeOwner();
  if (auth) return auth;
  try {
    const snapshot = await readInventoryLiveState();
    return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ rows: [], sync: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeOwner();
  if (auth) return auth;

  const startedAt = new Date().toISOString();
  try {
    const token = await ebayAccessToken();
    const [active, sold] = await Promise.all([
      fetchActiveListings(token, startedAt),
      fetchRecentPaidOrders(token, startedAt),
    ]);
    await writeSnapshot(active, sold, startedAt);
    const compact = new URL(request.url).searchParams.get("compact") === "1";
    if (compact) {
      return Response.json({
        sync: { updatedAt: startedAt },
        summary: { activeCount: active.length, soldCount: sold.length, updatedAt: startedAt },
      }, { headers: { "Cache-Control": "no-store" } });
    }
    const snapshot = await readInventoryLiveState();
    return Response.json({
      ...snapshot,
      summary: { activeCount: active.length, soldCount: sold.length, updatedAt: startedAt },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory refresh failed.";
    await env.DB.prepare(`
      INSERT INTO inventory_sync_state
        (source, updated_at, active_count, sold_count, records_written, error)
      VALUES (?, ?, 0, 0, 0, ?)
      ON CONFLICT(source) DO UPDATE SET updated_at = excluded.updated_at, error = excluded.error
    `).bind("ebay", startedAt, message.slice(0, 500)).run().catch(() => null);
    return Response.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

async function authorizeOwner() {
  const user = await getChatGPTUser();
  const ownerEmail = (process.env.INVENTORY_OWNER_EMAIL || "adamlbf@gmail.com").toLowerCase();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (user.email.toLowerCase() !== ownerEmail) return Response.json({ error: "Not authorized." }, { status: 403 });
  return null;
}

async function ebayAccessToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const refreshToken = process.env.EBAY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error("The hosted eBay connection is not configured.");

  const response = await fetch(`${EBAY_API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, scope: SCOPES }),
  });
  const body = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description || `eBay sign-in refresh failed (${response.status}).`);
  return body.access_token;
}

async function fetchActiveListings(token: string, updatedAt: string) {
  const first = await fetchActivePage(token, 1, updatedAt);
  const listings = [...first.listings];
  for (let page = 2; page <= first.totalPages; page += 8) {
    const pages = Array.from(
      { length: Math.min(8, first.totalPages - page + 1) },
      (_, index) => page + index,
    );
    const results = await Promise.all(pages.map((pageNumber) => fetchActivePage(token, pageNumber, updatedAt)));
    results.forEach((result) => listings.push(...result.listings));
  }
  return [...new Map(listings.map((listing) => [listing.sku, listing])).values()];
}

async function fetchActivePage(token: string, page: number, updatedAt: string) {
    const body = [
      "<DetailLevel>ReturnAll</DetailLevel>",
      "<ActiveList>",
      `<Pagination><EntriesPerPage>${PAGE_SIZE}</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination>`,
      "</ActiveList>",
    ].join("");
  const xml = await tradingCall(token, "GetMyeBaySelling", body);
  const block = xml.match(/<ActiveList>([\s\S]*?)<\/ActiveList>/i)?.[1] ?? "";
  const listings: ActiveListing[] = [];
  for (const match of block.matchAll(/<Item>([\s\S]*?)<\/Item>/gi)) {
    const item = match[1];
    const sku = xmlValue(item, "SKU");
    const listingId = xmlValue(item, "ItemID");
    if (!sku || !listingId) continue;
    const quantity = numeric(xmlValue(item, "Quantity"));
    const quantitySold = numeric(xmlValue(item, "QuantitySold"));
    listings.push({
      sku,
      status: "Listed",
      price: numeric(xmlValue(item, "CurrentPrice") || xmlValue(item, "StartPrice")),
      listingId,
      listingUrl: xmlValue(item, "ViewItemURL") || `https://www.ebay.com/itm/${listingId}`,
      quantityAvailable: Math.max(0, quantity - quantitySold),
      soldAt: null,
      updatedAt,
    });
  }
  return { listings, totalPages: Math.max(1, numeric(xmlValue(block, "TotalNumberOfPages"))) };
}

async function fetchRecentPaidOrders(token: string, updatedAt: string) {
  const sold = new Map<string, SoldListing>();
  const from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  let offset = 0;
  const limit = 200;
  while (true) {
    const url = new URL(`${EBAY_API}/sell/fulfillment/v1/order`);
    url.searchParams.set("filter", `creationdate:[${from}..${updatedAt}]`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const body = await response.json() as {
      total?: number;
      orders?: Array<{
        creationDate?: string;
        orderPaymentStatus?: string;
        cancelStatus?: { cancelState?: string };
        lineItems?: Array<{ sku?: string; legacyItemId?: string; total?: { value?: string } }>;
      }>;
    };
    if (!response.ok) throw new Error(`eBay orders refresh failed (${response.status}).`);
    for (const order of body.orders ?? []) {
      if (order.orderPaymentStatus !== "PAID" || order.cancelStatus?.cancelState === "CANCELED") continue;
      for (const item of order.lineItems ?? []) {
        if (!item.sku || !order.creationDate) continue;
        const current = sold.get(item.sku);
        if (current && current.soldAt >= order.creationDate) continue;
        sold.set(item.sku, {
          sku: item.sku,
          status: "Sold",
          price: item.total?.value ? Number(item.total.value) : null,
          listingId: item.legacyItemId ?? null,
          listingUrl: item.legacyItemId ? `https://www.ebay.com/itm/${item.legacyItemId}` : null,
          quantityAvailable: 0,
          soldAt: order.creationDate,
          updatedAt,
        });
      }
    }
    offset += body.orders?.length ?? 0;
    if (!body.orders?.length || offset >= Number(body.total ?? 0)) break;
  }
  return [...sold.values()];
}

async function writeSnapshot(active: ActiveListing[], sold: SoldListing[], updatedAt: string) {
  await env.DB.prepare(`
    UPDATE inventory_live_state
    SET status = 'Ended', quantity_available = 0, updated_at = ?
    WHERE status = 'Listed'
  `).bind(updatedAt).run();

  const upsert = `
    INSERT INTO inventory_live_state
      (sku, status, price, listing_id, listing_url, quantity_available, sold_at, last_seen_active_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET
      status = excluded.status,
      price = COALESCE(excluded.price, inventory_live_state.price),
      listing_id = COALESCE(excluded.listing_id, inventory_live_state.listing_id),
      listing_url = COALESCE(excluded.listing_url, inventory_live_state.listing_url),
      quantity_available = excluded.quantity_available,
      sold_at = excluded.sold_at,
      last_seen_active_at = COALESCE(excluded.last_seen_active_at, inventory_live_state.last_seen_active_at),
      updated_at = excluded.updated_at
  `;
  const activeSkus = new Set(active.map((item) => item.sku));
  const statements = [
    ...active.map((item) => env.DB.prepare(upsert).bind(
      item.sku, item.status, item.price, item.listingId, item.listingUrl,
      item.quantityAvailable, null, updatedAt, updatedAt,
    )),
    ...sold.filter((item) => !activeSkus.has(item.sku)).map((item) => env.DB.prepare(upsert).bind(
      item.sku, item.status, item.price, item.listingId, item.listingUrl,
      0, item.soldAt, null, updatedAt,
    )),
  ];
  for (let index = 0; index < statements.length; index += 100) {
    await env.DB.batch(statements.slice(index, index + 100));
  }
  await env.DB.prepare(`
    INSERT INTO inventory_sync_state
      (source, updated_at, active_count, sold_count, records_written, error)
    VALUES (?, ?, ?, ?, ?, NULL)
    ON CONFLICT(source) DO UPDATE SET
      updated_at = excluded.updated_at,
      active_count = excluded.active_count,
      sold_count = excluded.sold_count,
      records_written = excluded.records_written,
      error = NULL
  `).bind("ebay", updatedAt, active.length, sold.length, statements.length).run();
}

async function tradingCall(token: string, callName: string, body: string) {
  const request = `<?xml version="1.0" encoding="utf-8"?><${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents"><RequesterCredentials><eBayAuthToken>${escapeXml(token)}</eBayAuthToken></RequesterCredentials>${body}</${callName}Request>`;
  const response = await fetch(EBAY_TRADING_API, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1423",
      "X-EBAY-API-SITEID": "0",
    },
    body: request,
  });
  const xml = await response.text();
  const ack = xmlValue(xml, "Ack");
  if (!response.ok || !["Success", "Warning"].includes(ack)) throw new Error(`eBay listings refresh failed (${response.status}, ${ack || "unknown"}).`);
  return xml;
}

function xmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function numeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function decodeXml(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'");
}
