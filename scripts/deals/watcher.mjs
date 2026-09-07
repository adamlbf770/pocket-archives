import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ebayRequest } from "../ebay/api.mjs";
import { acquisitionCost, calculateDealEconomics, classifyBundle, comparableSlab, deliveredPrice, isBlockedTitle, parseSlab, slabSearchQuery } from "./deal-math.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const config = JSON.parse(await readFile(join(here, "config.json"), "utf8"));
const stateDir = join(root, "outputs/resale-notifier");
const statePath = join(stateDir, "state-v2.json");
const latestPath = join(stateDir, "latest.json");
const alertLogPath = join(stateDir, "alerts-v2.jsonl");
const rejectedLogPath = join(stateDir, "rejected-v2.jsonl");
const dashboardDataPath = join(root, "app/internal/slab-deals/deals.generated.ts");
const dryRun = process.argv.includes("--dry-run");
const testEmail = process.argv.includes("--test-email");

await mkdir(stateDir, { recursive: true });
const state = await readJson(statePath, { initialized: false, seen: {} });
const soldDatabase = await readJson(join(root, config.soldCompDatabase), { updatedAt: null, source: "No realized-sold feed connected", sales: [] });
if (state.soldDataUpdatedAt !== soldDatabase.updatedAt) state.seen = {};
state.soldDataUpdatedAt = soldDatabase.updatedAt;

if (testEmail) {
  sendEmail("Pocket Archives dealer scanner is connected", "Slab Hunter and Raw Card Hunter can send email from this Mac. BUY calls require conservative realized sold comps, minimum profit, minimum ROI, and A/B liquidity. No purchase is automatic.");
  console.log(`Test email sent to ${config.recipient}.`);
  process.exit(0);
}

const groups = [
  ...config.queries.slabs.map((query) => ({ hunter: "Slab Hunter", type: "slab", query, max: config.slabMaximumDeliveredPrice })),
  ...config.queries.illustrationRareBundles.map((query) => ({ hunter: "Raw Card Hunter", type: "bundle", query, max: config.bundleMaximumDeliveredPrice })),
  ...config.queries.ultraRareBundles.map((query) => ({ hunter: "Raw Card Hunter", type: "bundle", query, max: config.bundleMaximumDeliveredPrice })),
  ...config.queries.exactWatches.map((query) => ({ hunter: "Raw Card Hunter", type: "exact", query, max: config.bundleMaximumDeliveredPrice })),
];

const candidates = [];
for (const group of groups) {
  const items = await search(group.query, group.max, 50);
  for (const item of items) {
    if (!item.itemId || state.seen[item.itemId] || blocked(item, group.max)) continue;
    state.seen[item.itemId] = new Date().toISOString();
    const evaluated = group.type === "slab"
      ? evaluateSlab(item)
      : group.type === "bundle"
        ? evaluateBundle(item)
        : evaluateExactWatch(item, group.query);
    if (evaluated) candidates.push({ ...evaluated, hunter: group.hunter });
  }
}

const ranked = candidates.sort(compareCandidates);
const alerts = ranked.filter((candidate) => ["STRONG BUY", "BUY", "WATCH"].includes(candidate.recommendation));
const rejected = ranked.filter((candidate) => ["REVIEW", "PASS"].includes(candidate.recommendation));
const runAt = new Date().toISOString();
const sourceReady = Boolean(soldDatabase.sales.length);
const latest = {
  schemaVersion: 2,
  runAt,
  source: { name: soldDatabase.source, updatedAt: soldDatabase.updatedAt, realizedSoldCompCount: soldDatabase.sales.length, ready: sourceReady, note: sourceReady ? "BUY recommendations use realized sold comps." : "Sold-history permission is not connected. Active listings are discovery only; BUY is disabled." },
  policy: { noAutomaticPurchases: true, minimumProfit: config.minimumExpectedProfit, minimumRoiPercent: config.minimumExpectedRoi * 100, maximumSlabAsk: config.slabMaximumDeliveredPrice },
  summary: countRecommendations(ranked),
  candidates: ranked,
};

pruneState(state);
state.initialized = true;
state.lastRunAt = runAt;
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
await writeFile(latestPath, `${JSON.stringify(latest, null, 2)}\n`);
await writeDashboardData(latest);
for (const alert of alerts) await appendFile(alertLogPath, `${JSON.stringify(alert)}\n`);
for (const candidate of rejected) await appendFile(rejectedLogPath, `${JSON.stringify({ ...candidate, rejectedAt: runAt })}\n`);

if (alerts.length && state.initializedBeforeThisRun && !dryRun) {
  sendEmail(alerts.length === 1 ? `Pocket Archives ${alerts[0].recommendation}: ${alerts[0].title}` : `Pocket Archives: ${alerts.length} dealer opportunities`, formatEmail(alerts));
}

console.log(JSON.stringify({ scannedQueries: groups.length, candidates: ranked.length, alerts: alerts.length, emailed: Boolean(alerts.length && state.initializedBeforeThisRun && !dryRun), realizedSoldSourceReady: sourceReady, noAutomaticPurchases: true }, null, 2));

function evaluateSlab(item) {
  const slab = parseSlab(item.title);
  if (!slab) return null;
  const itemPrice = Number(item.price?.value ?? NaN);
  const shipping = Math.max(0, deliveredPrice(item) - itemPrice);
  const exactSales = soldDatabase.sales.filter((sale) => comparableSlab(item.title, sale.title));
  const soldPrices = exactSales.map((sale) => Number(sale.soldPrice) + Number(sale.shipping ?? 0)).filter(Number.isFinite);
  const economics = calculateDealEconomics({ itemPrice, shipping, taxRate: config.estimatedSalesTaxRate, soldPrices, soldDates: exactSales.map((sale) => sale.soldAt), grader: slab.grader, sellingFeeRate: config.estimatedSellingFeeRate, transactionFee: config.estimatedTransactionFee, outboundShipping: config.estimatedOutboundSlabShipping, packaging: config.estimatedSlabPackaging, minimumProfit: config.minimumExpectedProfit, minimumRoi: config.minimumExpectedRoi });
  const enoughComps = exactSales.length >= config.minimumSoldComps;
  const recommendation = enoughComps ? economics.recommendation : "PASS";
  return candidateRecord(item, slab, economics, exactSales.length, recommendation, enoughComps ? reasonFor(economics) : `Only ${exactSales.length} verified exact sold comp${exactSales.length === 1 ? "" : "s"}; ${config.minimumSoldComps} required.`);
}

function evaluateBundle(item) {
  const bundle = classifyBundle(item.title);
  if (!bundle?.count) return null;
  const comparable = soldDatabase.sales.filter((sale) => {
    const other = classifyBundle(sale.title);
    return other?.type === bundle.type && other.count >= bundle.count * 0.8 && other.count <= bundle.count * 1.2;
  });
  return rawCandidate(item, `${bundle.type}-only bundle (${bundle.count} cards)`, comparable, "Verify every pictured card and condition before approving.");
}

function evaluateExactWatch(item, query) {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const comparable = soldDatabase.sales.filter((sale) => terms.every((term) => String(sale.title).toLowerCase().includes(term)));
  return rawCandidate(item, `Exact watch: ${query}`, comparable, "Exact raw-card watch.");
}

function rawCandidate(item, kind, comparable, extraReason) {
  const itemPrice = Number(item.price?.value ?? NaN);
  const shipping = Math.max(0, deliveredPrice(item) - itemPrice);
  const economics = calculateDealEconomics({ itemPrice, shipping, taxRate: config.estimatedSalesTaxRate, soldPrices: comparable.map((sale) => Number(sale.soldPrice) + Number(sale.shipping ?? 0)), soldDates: comparable.map((sale) => sale.soldAt), grader: "RAW", sellingFeeRate: config.estimatedSellingFeeRate, transactionFee: config.estimatedTransactionFee, outboundShipping: 4, packaging: 0.5, minimumProfit: config.minimumExpectedProfit, minimumRoi: config.minimumExpectedRoi });
  const enoughComps = comparable.length >= config.minimumSoldComps;
  return candidateRecord(item, { grader: "RAW", grade: "Raw", cardNumber: "", kind }, economics, comparable.length, enoughComps ? economics.recommendation : "PASS", `${enoughComps ? reasonFor(economics) : `Only ${comparable.length} verified sold comps.`} ${extraReason}`);
}

function candidateRecord(item, identity, economics, compCount, recommendation, reason) {
  const itemPrice = Number(item.price?.value ?? 0);
  const shipping = round(Math.max(0, deliveredPrice(item) - itemPrice));
  const estimatedTax = round(acquisitionCost(itemPrice, shipping, config.estimatedSalesTaxRate) - itemPrice - shipping);
  const offerAvailable = (item.buyingOptions ?? []).includes("BEST_OFFER");
  return {
    foundAt: new Date().toISOString(), itemId: item.itemId, title: item.title, card: item.title, setNumber: identity.cardNumber || "Review listing", language: detectLanguage(item.title), grader: identity.grader, grade: identity.grade, certificationNumber: detectCertification(item.title), seller: item.seller?.username ?? "", sellerFeedback: item.seller?.feedbackPercentage ?? "", itemPrice: round(itemPrice), shipping, estimatedTax, landedCost: economics.landedCost, recentSoldMedian: economics.soldMedian, recentSoldRange: economics.soldRange, compCount, liquidityGrade: economics.liquidityGrade, medianDaysBetweenSales: economics.medianDaysBetweenSales, estimatedEbayFees: economics.estimatedFees, estimatedOutboundShipping: identity.grader === "RAW" ? 4 : config.estimatedOutboundSlabShipping, estimatedPackaging: identity.grader === "RAW" ? 0.5 : config.estimatedSlabPackaging, expectedNetProfit: economics.expectedNetProfit, expectedRoiPercent: economics.expectedRoiPercent, discountToSoldMarketPercent: economics.discountToSoldMarketPercent, rawNmValue: null, population: null, offerAvailable, maximumBuyPrice: offerAvailable ? economics.maximumBuyPrice : null, suggestedOffer: offerAvailable ? economics.suggestedOffer : null, recommendation, reason, image: item.image?.imageUrl ?? "", url: item.itemWebUrl ?? item.itemAffiliateWebUrl ?? "", automaticPurchase: false,
  };
}

function blocked(item, max) { const total = deliveredPrice(item); const seller = String(item.seller?.username ?? "").toLowerCase(); return !Number.isFinite(total) || total > max || isBlockedTitle(item.title) || config.sellerBlocklist.map((value) => value.toLowerCase()).includes(seller); }
async function search(query, max, limit) { const params = new URLSearchParams({ q: query, category_ids: "183454", limit: String(limit), sort: "newlyListed", filter: `price:[..${max}],priceCurrency:USD,deliveryCountry:US,buyingOptions:{FIXED_PRICE|BEST_OFFER}` }); const response = await ebayRequest(`/buy/browse/v1/item_summary/search?${params}`); return response.itemSummaries ?? []; }
function compareCandidates(a, b) { return (b.expectedNetProfit ?? -Infinity) - (a.expectedNetProfit ?? -Infinity) || (b.expectedRoiPercent ?? -Infinity) - (a.expectedRoiPercent ?? -Infinity) || liquidityRank(a.liquidityGrade) - liquidityRank(b.liquidityGrade) || (b.discountToSoldMarketPercent ?? -Infinity) - (a.discountToSoldMarketPercent ?? -Infinity); }
function liquidityRank(value) { return ({ A: 0, B: 1, C: 2, D: 3 })[value] ?? 4; }
function reasonFor(value) { if (value.recommendation === "STRONG BUY") return "At least 40% below conservative sold value with $20+ expected net and liquid sold history."; if (value.recommendation === "BUY") return "Meets conservative discount, minimum profit, ROI, and liquidity rules."; if (value.recommendation === "WATCH") return "Within 10 percentage points of the buy threshold."; if (value.recommendation === "REVIEW") return "Thin sold history; manual review required."; return "Does not clear every profit, ROI, discount, and liquidity gate."; }
function detectLanguage(title) { const match = String(title).match(/\b(Japanese|Korean|Simplified Chinese|Traditional Chinese|Chinese|Spanish|French|German|Italian|Portuguese|English)\b/i); return match ? match[1] : "Unspecified"; }
function detectCertification(title) { return String(title).match(/\b(?:cert(?:ification)?\s*(?:no\.?|#)?\s*)?(\d{7,12})\b/i)?.[1] ?? ""; }
function countRecommendations(values) { return values.reduce((summary, value) => ({ ...summary, [value.recommendation]: (summary[value.recommendation] ?? 0) + 1 }), { "STRONG BUY": 0, BUY: 0, WATCH: 0, REVIEW: 0, PASS: 0 }); }
function sendEmail(subject, body) { const script = `on run argv\nset recipientAddress to item 1 of argv\nset messageSubject to item 2 of argv\nset messageBody to item 3 of argv\ntell application "Mail"\nset outgoingMessage to make new outgoing message with properties {subject:messageSubject, content:messageBody & return & return, visible:false}\ntell outgoingMessage\nmake new to recipient at end of to recipients with properties {address:recipientAddress}\nsend\nend tell\nend tell\nend run`; execFileSync("osascript", ["-e", script, config.recipient, subject, body], { stdio: "ignore" }); }
function formatEmail(alerts) { return `Pocket Archives found ${alerts.length} comp-verified dealer opportunit${alerts.length === 1 ? "y" : "ies"}. No purchase was made.\n\n${alerts.map((alert, index) => `${index + 1}. ${alert.title}\n${alert.recommendation} · ${alert.liquidityGrade} liquidity · ${alert.compCount} sold comps\nAsk: $${alert.itemPrice.toFixed(2)} + $${alert.shipping.toFixed(2)} shipping\nLanded: $${alert.landedCost.toFixed(2)} · Sold median: $${alert.recentSoldMedian?.toFixed(2)}\nExpected net: $${alert.expectedNetProfit?.toFixed(2)} · ROI: ${alert.expectedRoiPercent?.toFixed(0)}%\n${alert.offerAvailable ? `Maximum buy: $${alert.maximumBuyPrice?.toFixed(2)} · Suggested offer: $${alert.suggestedOffer?.toFixed(2)}\n` : ""}${alert.reason}\n${alert.url}`).join("\n\n")}\n\nConfirm the exact card, grade, certification, language, variant, condition, and seller before approving any purchase.`; }
function pruneState(value) { const cutoff = Date.now() - 30 * 86_400_000; value.seen = Object.fromEntries(Object.entries(value.seen).filter(([, at]) => Date.parse(at) >= cutoff)); }
async function writeDashboardData(value) { await mkdir(dirname(dashboardDataPath), { recursive: true }); await writeFile(dashboardDataPath, `// Generated by scripts/deals/watcher.mjs.\nexport const slabDealsSnapshot = ${JSON.stringify(value, null, 2)} as const;\n`); }
async function readJson(path, fallback) { try { const parsed = JSON.parse(await readFile(path, "utf8")); parsed.initializedBeforeThisRun = Boolean(parsed.initialized); return parsed; } catch { return { ...fallback, initializedBeforeThisRun: false }; } }
function round(value) { return Math.round(value * 100) / 100; }
